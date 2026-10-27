import fs from 'node:fs';
import path from 'node:path';
import { runAgent } from './claude.ts';
import { devMachineIds, effortFor, hasArchitect, SIZE_ORDER, type FleetConfig } from './config.ts';
import type { RunContext } from './dev.ts';
import { info, step, warn } from './log.ts';
import { buildInventory, CHANGELOG_HEADER, changelogLine } from './inventory.ts';
import { ARCHIVE_DIR, GAME_DIR, PLANNING_DIR, REPO, SALVAGE_DIR, TASKS_DIR, rel } from './paths.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { loadState, saveState } from './state.ts';
import { commitAndPush } from './sync.ts';
import { formatTaskId, listTasks, maxTaskNumber, parseTask, taskFileName, unblockedTaskIds, writeTask, type Task, type TaskListing } from './tasks.ts';

const folderOf = (t: Task): string => path.basename(path.dirname(t.file));
const isArchived = (t: Task): boolean => path.dirname(t.file) === ARCHIVE_DIR;
const isFinished = (t: Task): boolean => !isArchived(t) && (t.status === 'done' || t.status === 'failed');
/** Waiting for a dev: still being designed, or designed and ready. */
const isQueued = (t: Task): boolean => t.status === 'design' || t.status === 'designing' || t.status === 'todo';
/** Statuses the PO may still edit or delete. */
const PO_EDITABLE = new Set<string>(['design', 'todo']);

/**
 * Returns why the PO should plan now, or null if it shouldn't. Planning is driven by
 * backpressure: each dev machine has a targetQueue, and the PO only tops queues up to it,
 * so fast machines (that drain their queue sooner) trigger planning more often.
 * Pass a listing that includes the archive, so archived dependencies count as done.
 */
export function poDue(fleet: FleetConfig, listing: TaskListing): string | null {
  const state = loadState();
  const last = state.lastPoRunAt ? Date.parse(state.lastPoRunAt) : 0;
  const minutes = (Date.now() - last) / 60_000;
  if (!state.lastPoRunAt) return 'first cycle';
  if (minutes < fleet.loop.poMinGapMinutes) return null;
  if (minutes >= fleet.loop.poMaxGapMinutes) return 'scheduled review';
  for (const id of devMachineIds(fleet)) {
    const queued = queueSize(listing, id);
    if (queued < fleet.machines[id]!.targetQueue) return `queue for ${id} is low (${queued}/${fleet.machines[id]!.targetQueue})`;
  }
  const finished = listing.tasks.filter(isFinished).length;
  if (finished > 0) return `${finished} finished task(s) to review`;
  if (listing.invalid.size > 0) return 'invalid task files';
  return null;
}

function describeMachines(fleet: FleetConfig): string {
  return devMachineIds(fleet)
    .map((id) => [id, fleet.machines[id]!] as const)
    .map(([id, m]) => `- **${id}**: ${m.label}, model ${m.model} (tier: ${m.tier}). Max task size **${m.maxTaskSize}**. Keep ${m.targetQueue} tasks queued. ${m.notes}`)
    .join('\n');
}

function describeQueues(fleet: FleetConfig, listing: TaskListing): string {
  const unblocked = unblockedTaskIds(listing.tasks);
  const byId = new Map(listing.tasks.map((t) => [t.id, t]));
  const waitsOn = (t: Task): string =>
    t.dependsOn
      .filter((d) => byId.get(d)?.status !== 'done')
      .map((d) => {
        const dep = byId.get(d);
        return dep ? `${d} (${folderOf(dep)}, ${dep.status})` : `${d} (missing)`;
      })
      .join(', ');
  return devMachineIds(fleet)
    .map((id) => {
      const open = listing.tasks.filter((t) => !isArchived(t) && folderOf(t) === id && (isQueued(t) || t.status === 'in-progress'));
      const queued = queueSize(listing, id);
      const blocked = open.filter((t) => isQueued(t) && !unblocked.has(t.id)).length;
      const need = Math.max(0, fleet.machines[id]!.targetQueue - queued);
      const lines = open.map((t) => `  - ${t.id} [${t.status}, size ${t.size}, priority ${t.priority}${unblocked.has(t.id) ? '' : `, blocked: waits on ${waitsOn(t)}`}] ${t.title}`);
      return [`### ${id} — ${queued} queued${blocked ? `, ${blocked} blocked` : ''}, needs ${need} more`, ...(lines.length ? lines : ['  - (empty)'])].join('\n');
    })
    .join('\n\n');
}

function describeFinished(finished: Task[]): string {
  if (finished.length === 0) return '(none since last cycle)';
  return finished
    .map((t) => {
      const report = t.body.slice(Math.max(0, t.body.search(/\n## (Result|Attempt|Rejected|Architect)/)));
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
    INVENTORY: buildInventory(GAME_DIR),
    NEXT_IDS: ids.join(', '),
    MACHINE_IDS: devMachineIds(fleet).join(', '),
  });

  const session = await runAgent(ctx.local, {
    label: `po-cycle${cycle}`,
    prompt,
    cwd: REPO,
    profile: 'po',
    effort: effortFor(fleet, ctx.local.machineId, 'po'),
    maxTurns: fleet.loop.poMaxTurns,
    timeoutMin: fleet.loop.poTimeoutMin,
  });

  const feedback: string[] = [];
  const reverted = await enforceWritable(git, 'po');
  if (reverted.length) feedback.push(`You may only write in tasks/<machine>/ and planning/. Reverted: ${reverted.join(', ')}`);
  const created = await validateTaskChanges(ctx, listing, first, feedback);

  // Record what got built (the PO's memory of the game, since it doesn't read code), then archive
  // what the PO has now seen, so the next cycle only shows new results.
  const built = finished.filter((t) => t.status === 'done' && fs.existsSync(t.file));
  if (built.length) {
    const changelog = path.join(PLANNING_DIR, 'CHANGELOG.md');
    const current = fs.existsSync(changelog) ? fs.readFileSync(changelog, 'utf8') : CHANGELOG_HEADER;
    fs.writeFileSync(changelog, `${current.trimEnd()}\n${built.map(changelogLine).join('\n')}\n`);
  }
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  let archived = 0;
  for (const t of finished) {
    if (!fs.existsSync(t.file)) continue;
    fs.renameSync(t.file, path.join(ARCHIVE_DIR, path.basename(t.file)));
    archived++;
  }
  // Salvaged work is only for retries: drop it once its task is archived or deleted.
  const open = new Set(listTasks(machineIds).tasks.map((t) => t.id));
  for (const f of fs.existsSync(SALVAGE_DIR) ? fs.readdirSync(SALVAGE_DIR) : []) {
    if (!open.has(path.basename(f, '.diff'))) fs.rmSync(path.join(SALVAGE_DIR, f), { force: true });
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
    let originalStatus: Task['status'] | undefined;
    if (existedBefore) {
      let oldStatus = 'design';
      try {
        const old = parseTask((await git.showAtHead(change.path)) ?? '', abs);
        oldStatus = old.status;
        originalId = old.id;
        originalStatus = old.status;
      } catch {
        /* unparseable before: let the PO fix it */
      }
      if (!PO_EDITABLE.has(oldStatus)) {
        await git.revertPath(change);
        feedback.push(`${change.path} is ${oldStatus}; only design and todo tasks may be edited or deleted.`);
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
    if (originalStatus) task.status = originalStatus; // and status: only the architect moves design -> todo
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
      // Every new task goes through the architect first (if the fleet has one).
      task.status = hasArchitect(fleet) ? 'design' : 'todo';
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

/** Queued tasks the machine can get to by itself; blocked ones don't keep it busy. */
function queueSize(listing: TaskListing, machine: string): number {
  const unblocked = unblockedTaskIds(listing.tasks);
  return listing.tasks.filter((t) => !isArchived(t) && folderOf(t) === machine && isQueued(t) && unblocked.has(t.id)).length;
}
