import fs from 'node:fs';
import path from 'node:path';
import { runAgent } from './claude.ts';
import { devMachineIds, SIZE_ORDER, type FleetConfig } from './config.ts';
import type { RunContext } from './dev.ts';
import { info, step, warn } from './log.ts';
import { ARCHIVE_DIR, REPO, TASKS_DIR, rel } from './paths.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { loadState, saveState } from './state.ts';
import { commitAndPush } from './sync.ts';
import { formatTaskId, listTasks, maxTaskNumber, parseTask, taskFileName, writeTask, type Task, type TaskListing } from './tasks.ts';

const isArchived = (t: Task): boolean => path.dirname(t.file) === ARCHIVE_DIR;
const isFinished = (t: Task): boolean => !isArchived(t) && (t.status === 'done' || t.status === 'failed');

/** Returns why the PO should plan now, or null if it shouldn't. */
export function poDue(fleet: FleetConfig, listing: TaskListing): string | null {
  const state = loadState();
  const last = state.lastPoRunAt ? Date.parse(state.lastPoRunAt) : 0;
  const minutes = (Date.now() - last) / 60_000;
  if (!state.lastPoRunAt) return 'first cycle';
  if (minutes < fleet.loop.poMinGapMinutes) return null;
  if (minutes >= fleet.loop.poMaxGapMinutes) return 'scheduled review';
  for (const id of devMachineIds(fleet)) {
    const todo = listing.tasks.filter((t) => !isArchived(t) && path.basename(path.dirname(t.file)) === id && t.status === 'todo').length;
    if (todo < fleet.machines[id]!.targetQueue) return `queue for ${id} is low (${todo}/${fleet.machines[id]!.targetQueue})`;
  }
  const finished = listing.tasks.filter(isFinished).length;
  if (finished > 0) return `${finished} finished task(s) to review`;
  if (listing.invalid.size > 0) return 'invalid task files';
  return null;
}

function describeMachines(fleet: FleetConfig): string {
  return Object.entries(fleet.machines)
    .filter(([, m]) => m.roles.includes('dev'))
    .map(([id, m]) => `- **${id}**: ${m.label}, model ${m.model} (tier: ${m.tier}). Max task size **${m.maxTaskSize}**. Keep ${m.targetQueue} todo tasks queued. ${m.notes}`)
    .join('\n');
}

function describeQueues(fleet: FleetConfig, listing: TaskListing): string {
  return devMachineIds(fleet)
    .map((id) => {
      const open = listing.tasks.filter((t) => !isArchived(t) && path.basename(path.dirname(t.file)) === id && (t.status === 'todo' || t.status === 'in-progress'));
      const todo = open.filter((t) => t.status === 'todo').length;
      const need = Math.max(0, fleet.machines[id]!.targetQueue - todo);
      const lines = open.map((t) => `  - ${t.id} [${t.status}, size ${t.size}, priority ${t.priority}] ${t.title}`);
      return [`### ${id} — ${todo} todo, needs ${need} more`, ...(lines.length ? lines : ['  - (empty)'])].join('\n');
    })
    .join('\n\n');
}

function describeFinished(finished: Task[]): string {
  if (finished.length === 0) return '(none since last cycle)';
  return finished
    .map((t) => {
      const report = t.body.slice(Math.max(0, t.body.search(/\n## (Result|Attempt)/)));
      return `### ${t.id} — ${t.status.toUpperCase()} — ${t.title}\n${report.trim().slice(-1800)}`;
    })
    .join('\n\n');
}

/** One planning cycle of the PO agent, then validation of everything it wrote. */
export async function runPoCycle(ctx: RunContext, reason: string): Promise<void> {
  const { fleet, git } = ctx;
  const state = loadState();
  const cycle = state.poCycles + 1;
  step(`PO cycle ${cycle} (${reason})`);
  const machineIds = Object.keys(fleet.machines);
  const listing = listTasks(machineIds, true);
  const finished = listing.tasks.filter(isFinished);
  const first = maxTaskNumber(listing.tasks) + 1;
  const ids = Array.from({ length: 12 }, (_, i) => formatTaskId(first + i));

  const prompt = renderPrompt('po', {
    DATE: new Date().toISOString().slice(0, 10),
    CYCLE: cycle,
    REASON: reason,
    MACHINES: describeMachines(fleet),
    QUEUES: describeQueues(fleet, listing),
    FINISHED: describeFinished(finished),
    FEEDBACK: state.poFeedback.length ? state.poFeedback.map((f) => `- ${f}`).join('\n') : '(none)',
    INVALID: listing.invalid.size ? [...listing.invalid].map(([f, e]) => `- ${rel(f)}: ${e}`).join('\n') : '(none)',
    GIT_LOG: (await git.logOneline(20, ['game/'])) || '(no game commits yet)',
    NEXT_IDS: ids.join(', '),
    MACHINE_IDS: devMachineIds(fleet).join(', '),
  });

  const session = await runAgent(ctx.local, {
    label: `po-cycle${cycle}`,
    prompt,
    cwd: REPO,
    profile: 'po',
    maxTurns: fleet.loop.poMaxTurns,
    timeoutMin: fleet.loop.poTimeoutMin,
  });

  const feedback: string[] = [];
  const reverted = await enforceWritable(git, 'po');
  if (reverted.length) feedback.push(`You may only write in tasks/<machine>/ and planning/. Reverted: ${reverted.join(', ')}`);
  const created = await validateTaskChanges(ctx, listing, first, feedback);

  // Archive what the PO has now seen, so the next cycle only shows new results.
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  let archived = 0;
  for (const t of finished) {
    if (!fs.existsSync(t.file)) continue;
    fs.renameSync(t.file, path.join(ARCHIVE_DIR, path.basename(t.file)));
    archived++;
  }

  const summary = session.result.trim().split('\n').slice(-1)[0]?.slice(0, 120) ?? '';
  const pushed = await commitAndPush(git, ['tasks/', 'planning/'], `po: cycle ${cycle}: ${created} new task(s), ${archived} archived${summary ? `\n\n${summary}` : ''}`);
  saveState({ ...loadState(), lastPoRunAt: new Date().toISOString(), poCycles: cycle, poFeedback: feedback });
  if (feedback.length) warn(`PO feedback for next cycle:\n  ${feedback.join('\n  ')}`);
  info(`PO cycle ${cycle}: ${created} new task(s), ${archived} archived${pushed ? '' : ' (push failed)'}`);
}

/**
 * Makes everything the PO wrote under tasks/ well-formed:
 * - edits to tasks that are not `todo` are reverted (runner owns those)
 * - unparseable files are removed
 * - ids are made unique, files renamed to T0042-slug.md, assignee = folder
 * - tasks too big for a machine move to the most capable machine
 * Returns the number of new tasks.
 */
async function validateTaskChanges(ctx: RunContext, before: TaskListing, firstId: number, feedback: string[]): Promise<number> {
  const { fleet, git } = ctx;
  const devIds = devMachineIds(fleet);
  const takenIds = new Set(before.tasks.map((t) => t.id));
  const pending: { task: Task; abs: string; isNew: boolean; machine: string; path: string }[] = [];

  // Pass 1: filter and normalize everything the PO touched.
  for (const change of await git.changedPaths()) {
    if (!change.path.startsWith('tasks/') || !change.path.endsWith('.md')) continue;
    const abs = path.join(REPO, change.path);
    const existedBefore = await git.existsAtHead(change.path);
    let originalId: string | undefined;
    if (existedBefore) {
      let oldStatus = 'todo';
      try {
        const old = parseTask((await git.showAtHead(change.path)) ?? '', abs);
        oldStatus = old.status;
        originalId = old.id;
      } catch {
        /* unparseable before: let the PO fix it */
      }
      if (oldStatus !== 'todo') {
        await git.revertPath(change);
        feedback.push(`${change.path} is ${oldStatus}; only todo tasks may be edited or deleted.`);
        continue;
      }
    }
    if (!fs.existsSync(abs)) continue; // the PO deleted a todo task: allowed

    let task: Task;
    try {
      task = parseTask(fs.readFileSync(abs, 'utf8'), abs);
    } catch (err) {
      await git.revertPath(change);
      feedback.push(`${change.path} was invalid and was removed: ${(err as Error).message}`);
      continue;
    }

    const parts = change.path.split('/');
    let machine = parts.length === 3 && devIds.includes(parts[1]!) ? parts[1]! : task.assignee;
    if (!devIds.includes(machine)) {
      await git.revertPath(change);
      feedback.push(`${change.path}: unknown machine "${machine}" (use one of ${devIds.join(', ')}). Removed.`);
      continue;
    }
    const limit = fleet.machines[machine]!.maxTaskSize;
    if (SIZE_ORDER[task.size] > SIZE_ORDER[limit]) {
      const capable = devIds.filter((id) => SIZE_ORDER[fleet.machines[id]!.maxTaskSize] >= SIZE_ORDER[task.size]);
      const target = capable.sort((a, b) => queueSize(before, a) - queueSize(before, b))[0];
      feedback.push(`${task.id} is size ${task.size} but ${machine} only takes up to ${limit}; moved to ${target ?? '(nobody)'}. Split big work into smaller tasks for weak machines.`);
      if (!target) {
        await git.revertPath(change);
        continue;
      }
      machine = target;
    }
    if (originalId) task.id = originalId; // existing tasks keep their id
    pending.push({ task, abs, isNew: !existedBefore, machine, path: change.path });
  }

  // Pass 2: new tasks keep a fresh, unused id; only collisions/reused ids get renumbered.
  const fresh = pending.filter((p) => p.isNew);
  const renumber: typeof fresh = [];
  for (const p of fresh) {
    if (Number(p.task.id.slice(1)) >= firstId && !takenIds.has(p.task.id)) takenIds.add(p.task.id);
    else renumber.push(p);
  }
  let nextNum = firstId;
  for (const p of renumber) {
    while (takenIds.has(formatTaskId(nextNum))) nextNum++;
    const id = formatTaskId(nextNum);
    feedback.push(`${p.path}: id ${p.task.id} was already used; renumbered to ${id}. Use the ids you are given.`);
    p.task.id = id;
    takenIds.add(id);
  }

  for (const { task, abs, isNew, machine } of pending) {
    task.assignee = machine;
    if (isNew) {
      task.status = 'todo';
      task.attempts = 0;
      task.created = new Date().toISOString().slice(0, 19) + 'Z';
      task.claimedAt = task.finishedAt = task.commit = undefined;
    }
    // New files get the canonical name; existing ones keep theirs unless they changed machine.
    const inRightFolder = path.dirname(abs) === path.join(TASKS_DIR, machine);
    const target = isNew || !inRightFolder ? path.join(TASKS_DIR, machine, taskFileName(task)) : abs;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (target !== abs) fs.rmSync(abs, { force: true });
    task.file = target;
    writeTask(task);
  }
  return fresh.length;
}

function queueSize(listing: TaskListing, machine: string): number {
  return listing.tasks.filter((t) => !isArchived(t) && path.basename(path.dirname(t.file)) === machine && t.status === 'todo').length;
}
