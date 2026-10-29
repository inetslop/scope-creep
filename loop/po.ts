import fs from 'node:fs';
import path from 'node:path';
import { runAgent } from './claude.ts';
import { devMachineIds, effortFor, hasArchitect, SIZE_ORDER, type FleetConfig } from './config.ts';
import type { RunContext } from './dev.ts';
import { info, step, warn } from './log.ts';
import { buildInventory, CHANGELOG_HEADER, changelogLine } from './inventory.ts';
import { ARCHIVE_DIR, GAME_DIR, GAME_REL, PLANNING_DIR, PLANNING_REL, PROJECT_DIR, REPO, SALVAGE_DIR, TASKS_DIR, TASKS_REL, rel } from './paths.ts';
import { describeModules, writeModuleDocs } from './modules.ts';
import { archivePlanning } from './planning.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { loadState, saveState } from './state.ts';
import { commitAndPush, pushMarker } from './sync.ts';
import { doneIds, formatTaskId, listTasks, lockFreeFor, maxTaskNumber, parseTask, pickTaskFor, sharedFiles, taskFileName, tasksById, unblockedTaskIds, writeTask, type Task, type TaskListing, type TaskSize } from './tasks.ts';

const isArchived = (t: Task): boolean => path.dirname(t.file) === ARCHIVE_DIR;
const isFinished = (t: Task): boolean => !isArchived(t) && (t.status === 'done' || t.status === 'failed');
/** Waiting for a dev: still being designed, or designed and ready. */
const isQueued = (t: Task): boolean => t.status === 'design' || t.status === 'designing' || t.status === 'todo';
/** Statuses the PO may still edit or delete. */
const PO_EDITABLE = new Set<string>(['design', 'todo']);

/**
 * What the shared pool is short of. `have`: waiting tasks (design to todo) that will get built
 * and that a running machine can take; `want`: the running dev machines' targetQueue added up.
 * `small`: the same for each smaller task size some running machine is limited to, so the weak
 * machines always have work they can take.
 */
export interface PoolNeeds {
  have: number;
  want: number;
  small: { size: TaskSize; have: number; want: number; machines: string[] }[];
}

/**
 * What the pool has and what the running machines want. Only work that can start now counts: a
 * queued task (being designed or ready) with no unfinished dependency. A task waiting on another
 * keeps no machine busy, and a pool of chains leaves the whole fleet idle.
 */
export function poolNeeds(fleet: FleetConfig, listing: TaskListing): PoolNeeds {
  const done = doneIds(listing.tasks);
  const devIds = devMachineIds(fleet);
  const maxOf = (id: string): number => SIZE_ORDER[fleet.machines[id]!.maxTaskSize];
  const biggest = Math.max(0, ...devIds.map(maxOf));
  const waiting = listing.tasks.filter(
    (t) =>
      !isArchived(t) &&
      isQueued(t) &&
      t.dependsOn.every((d) => done.has(d)) &&
      (t.assignee ? devIds.includes(t.assignee) : SIZE_ORDER[t.size] <= biggest),
  );
  const want = devIds.reduce((sum, id) => sum + fleet.machines[id]!.targetQueue, 0);
  const sizes = [...new Set(devIds.map((id) => fleet.machines[id]!.maxTaskSize))].filter((s) => SIZE_ORDER[s] < biggest);
  const small = sizes.map((size) => {
    const machines = devIds.filter((id) => fleet.machines[id]!.maxTaskSize === size);
    return {
      size,
      machines,
      want: machines.reduce((sum, id) => sum + fleet.machines[id]!.targetQueue, 0),
      have: waiting.filter((t) => !t.assignee && SIZE_ORDER[t.size] <= SIZE_ORDER[size]).length,
    };
  });
  return { have: waiting.length, want, small };
}

/** The marker commit a PO cycle pushes when it starts; the cycle's own "po: cycle N: ..." commit ends it. */
export const poStartedMessage = (cycle: number, reason: string): string => `po: cycle ${cycle} started (${reason})`;
/** Matches that marker: a machine whose last commit it is, with no claim, is planning. */
export const PO_STARTED = /^po: cycle \d+ started\b/;

/**
 * The most new tasks one PO cycle writes. With 8 to write at xhigh effort, the PO thought at length
 * and then wrote every task in one response, past the 32k output cap: every cycle failed and wrote
 * nothing (Oct 29, cycles 50 to 54). Capped, the pool fills over a few short cycles instead: while
 * it is low, the next cycle starts minutes after the last.
 */
export const PO_MAX_NEW_TASKS = 3;

/**
 * Size budgets (bytes) for the planning files the PO writes. Chokepoint's ROADMAP.md became a diary,
 * a "This cycle (N)" paragraph per epic every cycle, and grew to 110 KB: the PO re-read it every
 * cycle and rewrote whole paragraphs of it, past the 32k output cap (Oct 29, cycles 50 to 57).
 */
export const PLANNING_BUDGETS: Readonly<Record<string, number>> = { 'ROADMAP.md': 24_000, 'IDEAS.md': 40_000, 'VISION.md': 6_000 };

/** One line of PO feedback per planning file over its budget, given each file's size in bytes. */
export function planningBudgetFeedback(sizes: Readonly<Record<string, number>>): string[] {
  return Object.entries(PLANNING_BUDGETS)
    .filter(([file, budget]) => (sizes[file] ?? 0) > budget)
    .map(
      ([file, budget]) =>
        `planning/${file} is ${Math.round(sizes[file]! / 1000)} KB, over its ${budget / 1000} KB budget. Before planning, shrink it with several small Edits (one section per Edit, never one Write of the whole file): drop history and per-cycle notes, collapse finished work to one line.`,
    );
}

function planningSizes(): Record<string, number> {
  return Object.fromEntries(Object.keys(PLANNING_BUDGETS).map((f) => [f, fs.existsSync(path.join(PLANNING_DIR, f)) ? fs.statSync(path.join(PLANNING_DIR, f)).size : 0]));
}

/** How many tasks this cycle writes: what the pool lacks (at least one per idle machine), at most PO_MAX_NEW_TASKS. */
export function tasksToWrite(needs: PoolNeeds, idleCount: number): number {
  return Math.min(PO_MAX_NEW_TASKS, Math.max(0, needs.want - needs.have, idleCount));
}

/** With machines idle, the PO may plan past what the machines want, up to this many queued tasks per wanted one. */
const IDLE_POOL_CAP = 3;

/**
 * Running dev machines that hold no claim and could take nothing in the pool right now, the file
 * lock included (tasks.ts pickTaskFor): with a pool full of tasks that edit the same files, they
 * sit idle even though the pool looks full.
 */
export function idleMachines(fleet: FleetConfig, listing: TaskListing, nowMs = Date.now()): string[] {
  const claimed = new Set(listing.tasks.flatMap((t) => (t.status === 'in-progress' ? [t.assignee] : t.status === 'designing' ? [t.extra.designer ?? ''] : [])));
  return devMachineIds(fleet).filter((id) => !claimed.has(id) && !pickTaskFor(id, fleet, listing.tasks, nowMs));
}

/** Why the PO should plan for idle machines, or null: some are idle and the pool is under its cap. */
export function idleReason(fleet: FleetConfig, listing: TaskListing, nowMs = Date.now()): string | null {
  const idle = idleMachines(fleet, listing, nowMs);
  if (idle.length === 0) return null;
  const queued = listing.tasks.filter((t) => !isArchived(t) && isQueued(t)).length;
  if (queued >= poolNeeds(fleet, listing).want * IDLE_POOL_CAP) return null;
  return `${idle.join(', ')} ${idle.length === 1 ? 'has' : 'have'} nothing to take right now`;
}

/**
 * Returns why the PO should plan now, or null if it shouldn't. Planning is driven by
 * backpressure: the PO tops the shared pool up to what the running machines want (their
 * targetQueue added up, and enough small tasks for the weak ones), so planning keeps pace with
 * how fast the fleet builds. Pass a listing that includes the archive, so archived dependencies
 * count as done.
 */
export function poDue(fleet: FleetConfig, listing: TaskListing): string | null {
  const state = loadState();
  const last = state.lastPoRunAt ? Date.parse(state.lastPoRunAt) : 0;
  const minutes = (Date.now() - last) / 60_000;
  if (!state.lastPoRunAt) return 'first cycle';
  if (minutes < fleet.loop.poMinGapMinutes) return null;
  if (minutes >= fleet.loop.poMaxGapMinutes) return 'scheduled review';
  return planningReason(fleet, listing);
}

/**
 * Whether there is planning to do right now, and why: the pool is low (overall or in the small
 * sizes), a machine has nothing to take, a failed or rejected task needs a decision, or task files
 * are broken. A task that was simply built is no reason: a PO cycle costs the fastest machine 10 to
 * 30 minutes, and with the whole fleet finishing tasks it ran after nearly every one, to do nothing
 * but archive (ten cycles in a row with no new task). Built tasks wait in the pool, which no machine
 * picks from or waits on, until the next cycle reviews and archives them in one batch, at the
 * latest at the scheduled review.
 */
export function planningReason(fleet: FleetConfig, listing: TaskListing, nowMs = Date.now()): string | null {
  const needs = poolNeeds(fleet, listing);
  if (needs.have < needs.want) return `the pool is low (${needs.have}/${needs.want})`;
  for (const s of needs.small) if (s.have < s.want) return `few size-${s.size} tasks for ${s.machines.join(', ')} (${s.have}/${s.want})`;
  const idle = idleReason(fleet, listing, nowMs);
  if (idle) return idle;
  const failed = listing.tasks.filter((t) => isFinished(t) && t.status === 'failed').length;
  if (failed > 0) return `${failed} failed task(s) to decide on`;
  if (listing.invalid.size > 0) return 'invalid task files';
  return null;
}

function describeMachines(fleet: FleetConfig): string {
  return devMachineIds(fleet)
    .map((id) => [id, fleet.machines[id]!] as const)
    .map(([id, m]) => `- **${id}**: ${m.label}, model ${m.model} (tier: ${m.tier}). Takes tasks up to size **${m.maxTaskSize}**. ${m.notes}`)
    .join('\n');
}

/**
 * For the PO when machines are idle: who, and which files the open work crowds into, so the new
 * tasks land somewhere else (a task can't start while another task edits one of its files).
 */
function idleLines(fleet: FleetConfig, listing: TaskListing, idle: readonly string[]): string[] {
  if (idle.length === 0) return [];
  const shared = (t: Task): string[] => sharedFiles(t, lockFreeFor(fleet));
  const editing = listing.tasks.filter((t) => t.status === 'in-progress').flatMap((t) => shared(t).map((f) => `${f} (${t.id})`));
  const counts = new Map<string, number>();
  for (const t of listing.tasks.filter((x) => !isArchived(x) && isQueued(x))) for (const f of shared(t)) counts.set(f, (counts.get(f) ?? 0) + 1);
  const crowded = [...counts].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} (${n} tasks)`);
  const label = (id: string): string => `${id} (up to ${fleet.machines[id]!.maxTaskSize})`;
  return [
    `- ${idle.map(label).join(', ')} ${idle.length === 1 ? 'has' : 'have'} nothing to take right now: the tasks they could build all edit a file another task is editing. Write at least one task each, in their size, that lives in new files (a new HUD element, a reaction to kills or leaks, a new effect, a new enemy or augment) rather than changing the files below.`,
    ...(editing.length ? [`- Being edited now: ${editing.join(', ')}.`] : []),
    ...(crowded.length ? [`- Most open tasks also edit: ${crowded.join(', ')}.`] : []),
  ];
}

/** The pool for the PO: what it needs, then every open task with who builds it and what blocks it. */
function describePool(fleet: FleetConfig, listing: TaskListing): string {
  const needs = poolNeeds(fleet, listing);
  const unblocked = unblockedTaskIds(listing.tasks);
  const byId = tasksById(listing.tasks);
  const waitsOn = (t: Task): string =>
    t.dependsOn
      .filter((d) => byId.get(d)?.status !== 'done')
      .map((d) => `${d} (${byId.get(d)?.status ?? 'missing'})`)
      .join(', ');
  const idle = idleMachines(fleet, listing);
  const more = tasksToWrite(needs, idle.length);
  const gap = Math.max(0, needs.want - needs.have, idle.length);
  const smallLines = needs.small
    .filter((s) => s.have < s.want)
    .map((s) => `- at least ${Math.min(s.want - s.have, more)} of them size ${s.size} or smaller (for ${s.machines.join(', ')}, which take nothing bigger)`);
  const chained = listing.tasks.filter((t) => !isArchived(t) && isQueued(t) && waitsOn(t) !== '').length;
  const header = [
    `The pool has ${needs.have} task(s) that can start now (no unfinished dependency); the running machines want ${needs.want}. Write **${more}** more` +
      (gap > more ? ` (at most ${PO_MAX_NEW_TASKS} per cycle; the next cycle, minutes after this one, writes the rest).` : '.') +
      (chained ? ` ${chained} more wait on other tasks and don't count: a task waiting on another keeps no machine busy.` : ''),
    ...smallLines,
    ...idleLines(fleet, listing, idle),
  ].join('\n');
  const open = listing.tasks
    .filter((t) => !isArchived(t) && (isQueued(t) || t.status === 'in-progress'))
    .sort((a, b) => a.id.localeCompare(b.id));
  const lines = open.map((t) => {
    const who = t.status === 'in-progress' ? `, being built by ${t.assignee}` : t.assignee ? `, ${t.assignee}'s own` : '';
    const epic = t.extra.epic ? `, epic ${t.extra.epic}` : '';
    const waits = waitsOn(t);
    const blocked = !waits ? '' : unblocked.has(t.id) ? `, waits on ${waits}` : `, blocked for good: waits on ${waits}`;
    return `- ${t.id} [${t.status}, size ${t.size}, priority ${t.priority}${epic}${who}${blocked}] ${t.title}`;
  });
  return [header, '', ...(lines.length ? lines : ['- (the pool is empty)'])].join('\n');
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
  // Planning holds no claim: without this marker the machine looks idle on the site and in `npm run status`.
  await pushMarker(git, poStartedMessage(cycle, reason));
  const listing = listTasks(true);
  const finished = listing.tasks.filter(isFinished);
  const first = maxTaskNumber(listing.tasks) + 1;
  const ids = Array.from({ length: 12 }, (_, i) => formatTaskId(first + i));
  // Its own step, before the PO reads anything: done epics and old cycle notes leave the roadmap.
  const moved = archivePlanning();
  if (moved) info(`PO cycle ${cycle}: archived ${Math.round(moved / 1000)} KB of roadmap history`);
  // The module docs (planning/modules/) show the PO what exists, with the game's real data.
  const modules = writeModuleDocs();
  const feedbackIn = [...state.poFeedback, ...planningBudgetFeedback(planningSizes())];

  const prompt = renderPrompt('po', {
    DATE: new Date().toISOString().slice(0, 10),
    CYCLE: cycle,
    REASON: reason,
    MACHINES: describeMachines(fleet),
    QUEUES: describePool(fleet, listing),
    FINISHED: describeFinished(finished),
    FEEDBACK: feedbackIn.length ? feedbackIn.map((f) => `- ${f}`).join('\n') : '(none)',
    INVALID: listing.invalid.size ? [...listing.invalid].map(([f, e]) => `- ${rel(f)}: ${e}`).join('\n') : '(none)',
    GIT_LOG: (await git.logOneline(20, [GAME_REL])) || '(no game commits yet)',
    INVENTORY: buildInventory(GAME_DIR),
    MODULES: describeModules(modules),
    NEXT_IDS: ids.join(', '),
    MACHINE_IDS: devMachineIds(fleet).join(', '),
  });

  const session = await runAgent(ctx.local, {
    label: `po-cycle${cycle}`,
    prompt,
    // The project folder (the repo root for Scope Creep), so planning/ and tasks/ in the prompt are right.
    cwd: PROJECT_DIR,
    profile: 'po',
    effort: effortFor(fleet, ctx.local.machineId, 'po'),
    maxTurns: fleet.loop.poMaxTurns,
    timeoutMin: fleet.loop.poTimeoutMin,
  });

  const feedback: string[] = [];
  const reverted = await enforceWritable(git, 'po');
  if (reverted.length) feedback.push(`You may only write in ${TASKS_REL} and ${PLANNING_REL}. Reverted: ${reverted.join(', ')}`);
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
  const open = new Set(listTasks().tasks.map((t) => t.id));
  for (const f of fs.existsSync(SALVAGE_DIR) ? fs.readdirSync(SALVAGE_DIR) : []) {
    if (!open.has(path.basename(f, '.diff'))) fs.rmSync(path.join(SALVAGE_DIR, f), { force: true });
  }

  const summary = session.result.trim().split('\n').slice(-1)[0]?.slice(0, 120) ?? '';
  const pushed = await commitAndPush(git, [TASKS_REL, PLANNING_REL], `po: cycle ${cycle}: ${created} new task(s), ${archived} archived${summary ? `\n\n${summary}` : ''}`);
  saveState({ ...loadState(), lastPoRunAt: new Date().toISOString(), poCycles: cycle, poFeedback: feedback });
  if (feedback.length) warn(`PO feedback for next cycle:\n  ${feedback.join('\n  ')}`);
  info(`PO cycle ${cycle}: ${created} new task(s), ${archived} archived${pushed ? '' : ' (push failed)'}`);
}

/** What happened to one new task's id: kept, or renumbered because the PO reused an id or one appeared on main meanwhile. */
export interface IdAssignment {
  from: string;
  to: string;
  reason?: 'reused' | 'upstream';
}

/**
 * Gives the PO's new tasks unused ids. `taken`: ids that existed when the cycle started; `upstream`:
 * the ids on origin/main just before the push. A human can write tasks while a cycle runs (half an
 * hour), and the PO's ids were picked at its start: T0073, T0074, T0102 and T0103 each ended up on
 * two different tasks that way.
 */
export function assignNewIds(ids: readonly string[], firstId: number, taken: ReadonlySet<string>, upstream: ReadonlySet<string>): IdAssignment[] {
  const used = new Set([...taken, ...upstream]);
  const out: IdAssignment[] = ids.map((id) => {
    if (Number(id.slice(1)) >= firstId && !used.has(id)) {
      used.add(id);
      return { from: id, to: id };
    }
    // Only main's newcomers are not the PO's mistake; an id it reused or wrote twice is.
    return { from: id, to: '', reason: upstream.has(id) && !taken.has(id) && Number(id.slice(1)) >= firstId ? 'upstream' : 'reused' };
  });
  let next = firstId;
  for (const a of out) {
    if (a.to) continue;
    while (used.has(formatTaskId(next))) next++;
    a.to = formatTaskId(next);
    used.add(a.to);
  }
  return out;
}

/** The task ids on origin/main, fetched now; empty (with a warning) when the fetch fails. */
async function upstreamTaskIds(git: RunContext['git']): Promise<Set<string>> {
  try {
    await git.fetch();
  } catch (err) {
    warn(`could not fetch to check task ids against main: ${(err as Error).message.split('\n')[0]}`);
    return new Set();
  }
  const r = await git.raw(['grep', '-h', '-E', '^id: ', 'origin/main', '--', TASKS_REL]);
  return new Set([...r.stdout.matchAll(/^id:\s*(T\d+)/gm)].map((m) => m[1]!));
}

/**
 * Makes everything the PO wrote under tasks/ well-formed:
 * - edits to tasks that are not `design`/`todo` are reverted (runner owns those)
 * - unparseable files are removed, and tasks bigger than any running machine takes
 * - ids are made unique; new tasks go into the pool as tasks/T0042-slug.md with no assignee
 * Returns the number of new tasks.
 */
async function validateTaskChanges(ctx: RunContext, before: TaskListing, firstId: number, feedback: string[]): Promise<number> {
  const { fleet, git } = ctx;
  const devIds = devMachineIds(fleet);
  const takenIds = new Set(before.tasks.map((t) => t.id));
  const pending: { task: Task; abs: string; isNew: boolean; path: string }[] = [];

  // Pass 1: filter and normalize everything the PO touched.
  for (const change of await git.changedPaths()) {
    if (!change.path.startsWith(TASKS_REL) || !change.path.endsWith('.md')) continue;
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

    // Only a size some running machine takes; nobody is assigned: the pool is shared.
    const capable = devIds.filter((id) => SIZE_ORDER[fleet.machines[id]!.maxTaskSize] >= SIZE_ORDER[task.size]);
    if (capable.length === 0) {
      await git.revertPath(change);
      feedback.push(`${change.path}: size ${task.size} is bigger than any running machine takes. Split it into smaller tasks.`);
      continue;
    }
    const inFolder = change.path.slice(TASKS_REL.length).includes('/');
    if (!existedBefore && inFolder) feedback.push(`${change.path}: new tasks go straight into the pool (${TASKS_REL}<id>-<slug>.md), not into a machine folder. Moved.`);
    if (originalId) task.id = originalId; // existing tasks keep their id
    if (originalStatus) task.status = originalStatus; // and status: only the architect moves design -> todo
    pending.push({ task, abs, isNew: !existedBefore, path: change.path });
  }

  // Pass 2: new tasks keep a fresh, unused id; reused ids and ids taken on main meanwhile get renumbered.
  const fresh = pending.filter((p) => p.isNew);
  const assigned = assignNewIds(fresh.map((p) => p.task.id), firstId, takenIds, await upstreamTaskIds(git));
  const moved = new Map<string, string>();
  fresh.forEach((p, i) => {
    const a = assigned[i]!;
    if (a.reason === 'reused') feedback.push(`${p.path}: id ${a.from} was already used; renumbered to ${a.to}. Use the ids you are given.`);
    if (a.reason === 'upstream') {
      info(`${p.path}: ${a.from} was taken on main during this cycle; renumbered to ${a.to}`);
      moved.set(a.from, a.to);
    }
    p.task.id = a.to;
  });
  // The PO's own tasks that depend on a renumbered one follow it.
  for (const p of pending) p.task.dependsOn = p.task.dependsOn.map((d) => moved.get(d) ?? d);

  for (const { task, abs, isNew } of pending) {
    if (isNew) {
      // Every new task goes through the architect first (if the fleet has one), into the pool.
      task.status = hasArchitect(fleet) ? 'design' : 'todo';
      task.attempts = 0;
      task.assignee = '';
      task.created = new Date().toISOString().slice(0, 19) + 'Z';
      task.claimedAt = task.finishedAt = task.commit = undefined;
    }
    // New files get the canonical name in the pool; existing ones stay where they are.
    const target = isNew ? path.join(TASKS_DIR, taskFileName(task)) : abs;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (target !== abs) fs.rmSync(abs, { force: true });
    task.file = target;
    writeTask(task);
  }
  return fresh.length;
}
