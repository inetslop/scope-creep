import path from 'node:path';
import { runAgent } from './claude.ts';
import { architectMachineIds, effortFor, SIZE_ORDER, type FleetConfig } from './config.ts';
import type { RunContext } from './dev.ts';
import { info, step, warn } from './log.ts';
import { GAME_DIR, REPO, rel } from './paths.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { updateTaskAndPush } from './sync.ts';
import { appendSection, designedFiles, listTasks, readTask, type Task } from './tasks.ts';

/**
 * The architect stage: between the PO and the devs. For each task in `design` it reads
 * the code (read-only) and returns a concrete design: files, interfaces, steps, pitfalls,
 * tests. The runner writes it into the task as "## Design" and moves the task to `todo`,
 * where the assignee's dev agent picks it up. Rejections go back to the PO as `failed`.
 *
 * Several machines may design. Each claims a task first (status `designing`, frontmatter
 * `designer: <machine>`, pushed) so no two architects design the same task. A claim is
 * released when its runner restarts, and may be taken over once it is older than the
 * architect timeout plus a margin (the claiming machine probably died).
 */

export interface ArchitectOutcome {
  kind: 'ready' | 'reject' | 'invalid';
  design: string;
  dependsOn: string[];
  reason: string;
}

/** Parses the architect's final message (see agents/prompts/architect.md for the format). */
export function parseArchitectResult(text: string): ArchitectOutcome {
  const reject = /STATUS:\s*REJECT\b:?\s*(.*)/i.exec(text);
  if (reject) return { kind: 'reject', design: '', dependsOn: [], reason: reject[1]?.trim() || '(no reason given)' };
  const design = /DESIGN:\s*([\s\S]*?)(?:\n[ \t]*DEPENDS_ON:|\n[ \t]*STATUS:|$)/i.exec(text)?.[1]?.trim() ?? '';
  const deps = /DEPENDS_ON:\s*(.*)/i.exec(text)?.[1] ?? '';
  const dependsOn = [...deps.matchAll(/T\d{3,}/gi)].map((m) => m[0].toUpperCase());
  if (!/STATUS:\s*READY\b/i.test(text)) return { kind: 'invalid', design, dependsOn, reason: 'no "STATUS: READY" line' };
  if (design.length < 40) return { kind: 'invalid', design, dependsOn, reason: 'the design was empty or too short' };
  return { kind: 'ready', design, dependsOn, reason: '' };
}

const OPEN = new Set(['design', 'designing', 'todo', 'in-progress']);
const folderOf = (t: Task): string => path.basename(path.dirname(t.file));
const now = (): string => new Date().toISOString().slice(0, 19) + 'Z';

/** Minutes after which another architect may take over a `designing` claim. */
export const staleClaimMinutes = (fleet: FleetConfig): number => fleet.loop.architectTimeoutMin + 30;

export function isStaleClaim(t: Task, staleMinutes: number, nowMs = Date.now()): boolean {
  if (t.status !== 'designing') return false;
  const claimed = t.claimedAt ? Date.parse(t.claimedAt) : Number.NaN;
  return !Number.isFinite(claimed) || nowMs - claimed > staleMinutes * 60_000;
}

/**
 * Which tasks this architect designs, by size: nothing above its maxDesignSize, and tasks that a
 * smaller architect (smaller maxDesignSize, not paused) also covers only once they have waited
 * loop.designGraceMinutes, so the small machine gets them first and the big one keeps to big work.
 */
export function sizeFilter(fleet: FleetConfig, me: string, nowMs = Date.now()): (t: Task) => boolean {
  const maxOf = (id: string): number => SIZE_ORDER[fleet.machines[id]?.maxDesignSize ?? 'L'];
  const mine = maxOf(me);
  const smaller = architectMachineIds(fleet)
    .filter((id) => id !== me)
    .map(maxOf)
    .filter((max) => max < mine);
  const leaveUpTo = Math.max(0, ...smaller);
  const graceMs = (fleet.loop.designGraceMinutes ?? 20) * 60_000;
  return (t) => {
    const size = SIZE_ORDER[t.size];
    if (size > mine) return false;
    if (size > leaveUpTo) return true;
    const created = t.created ? Date.parse(t.created) : Number.NaN;
    return !Number.isFinite(created) || nowMs - created >= graceMs;
  };
}

/** Tasks this architect may design, best first. `preferOwn` puts the machine's own tasks first. */
export function designCandidates(
  tasks: readonly Task[],
  me: string,
  opts: { preferOwn: boolean; staleMinutes: number; nowMs?: number; mayDesign?: (t: Task) => boolean },
): Task[] {
  const own = (t: Task): number => (opts.preferOwn && folderOf(t) === me ? 0 : 1);
  return tasks
    .filter((t) => t.status === 'design' || isStaleClaim(t, opts.staleMinutes, opts.nowMs))
    .filter((t) => opts.mayDesign?.(t) ?? true)
    .sort((a, b) => own(a) - own(b) || a.priority - b.priority || a.id.localeCompare(b.id));
}

/** Files named in a task's design, so the architect can see what other open tasks will touch. */
function touches(t: Task): string {
  const files = designedFiles(t);
  return files.length ? ` — touches ${files.slice(0, 8).join(', ')}` : '';
}

export interface ArchitectPassOptions {
  /** Most designs to do in this pass. */
  max: number;
  /** Design this machine's own tasks first (idle architects unblock themselves). */
  preferOwn: boolean;
}

/** Claims and designs up to `max` tasks. Returns how many it designed. */
export async function runArchitectPass(ctx: RunContext, opts: ArchitectPassOptions): Promise<number> {
  const me = ctx.local.machineId;
  const staleMinutes = staleClaimMinutes(ctx.fleet);
  let designed = 0;
  while (designed < opts.max) {
    // Re-read each time: claims and designs by other machines arrive with every sync.
    const all = listTasks(Object.keys(ctx.fleet.machines)).tasks;
    let claimed: Task | undefined;
    for (const candidate of designCandidates(all, me, { preferOwn: opts.preferOwn, staleMinutes, mayDesign: sizeFilter(ctx.fleet, me) })) {
      if (await claimDesign(ctx, candidate, staleMinutes)) {
        claimed = readTask(path.join(REPO, rel(candidate.file)));
        break;
      }
    }
    if (!claimed) break;
    await designTask(ctx, claimed, listTasks(Object.keys(ctx.fleet.machines)).tasks);
    designed++;
  }
  return designed;
}

/** Pushes `designing` + `designer: <me>`. False if another architect got there first. */
function claimDesign(ctx: RunContext, task: Task, staleMinutes: number): Promise<boolean> {
  const me = ctx.local.machineId;
  return updateTaskAndPush(
    ctx.git,
    rel(task.file),
    (t) => {
      const stale = isStaleClaim(t, staleMinutes);
      if (t.status !== 'design' && !stale) return false;
      if (stale) warn(`${t.id}: taking over a stale design claim from ${t.extra.designer ?? '?'}`);
      t.status = 'designing';
      t.extra.designer = me;
      t.claimedAt = now();
      return true;
    },
    `${task.id}: design claimed by ${me}`,
  );
}

async function designTask(ctx: RunContext, task: Task, all: Task[]): Promise<void> {
  const { fleet, git, local } = ctx;
  const me = local.machineId;
  const assigneeId = folderOf(task);
  const assignee = fleet.machines[assigneeId];
  step(`${task.id} "${task.title}": designing it for ${assigneeId}`);

  const others = all
    .filter((t) => t.id !== task.id && OPEN.has(t.status))
    .map((t) => `- ${t.id} [${t.status}, ${folderOf(t)}] ${t.title}${touches(t)}`)
    .join('\n');

  let result = '';
  try {
    const session = await runAgent(local, {
      label: `${task.id}-architect`,
      prompt: renderPrompt('architect', {
        TASK_ID: task.id,
        TASK_TITLE: task.title,
        TASK_SIZE: task.size,
        TASK_BODY: task.body,
        ASSIGNEE: assigneeId,
        ASSIGNEE_LABEL: assignee ? `${assignee.label}, model ${assignee.model}, tier ${assignee.tier}` : assigneeId,
        ASSIGNEE_NOTES: assignee?.notes ?? '',
        OTHER_TASKS: others || '(none)',
      }),
      cwd: GAME_DIR,
      profile: 'architect',
      effort: effortFor(fleet, me, 'architect'),
      maxTurns: fleet.loop.architectMaxTurns,
      timeoutMin: fleet.loop.architectTimeoutMin,
    });
    result = session.result;
  } catch (err) {
    warn(`${task.id}: architect session crashed: ${(err as Error).message}`);
  }
  const reverted = await enforceWritable(git, 'architect');
  if (reverted.length) warn(`the architect changed files; reverted: ${reverted.join(', ')}`);

  const outcome = parseArchitectResult(result);
  const known = new Set(all.map((t) => t.id));
  outcome.dependsOn = outcome.dependsOn.filter((d) => d !== task.id && known.has(d));
  const pushed = await updateTaskAndPush(
    git,
    rel(task.file),
    (t) => {
      if (t.status !== 'designing' || t.extra.designer !== me) return false; // claim lost (taken over or PO removed it)
      delete t.extra.designer;
      if (outcome.kind === 'ready') {
        t.status = 'todo';
        t.claimedAt = undefined;
        t.dependsOn = [...new Set([...t.dependsOn, ...outcome.dependsOn])];
        // Nest the design's own "## " headings under the Design section.
        appendSection(t, `Design (architect, ${me})`, outcome.design.replace(/^## /gm, '### '));
        return true;
      }
      const attempts = Number(t.extra.design_attempts ?? 0) + 1;
      t.extra.design_attempts = String(attempts);
      if (outcome.kind === 'reject') {
        t.status = 'failed';
        t.finishedAt = now();
        appendSection(t, `Rejected by architect (${me})`, outcome.reason);
      } else if (attempts >= fleet.loop.architectMaxAttempts) {
        t.status = 'failed';
        t.finishedAt = now();
        appendSection(t, `Architect could not design it (${me})`, `${outcome.reason} after ${attempts} attempt(s). Last output:\n\n\`\`\`\n${result.slice(-1500)}\n\`\`\``);
      } else {
        t.status = 'design'; // release the claim for another try
        t.claimedAt = undefined;
      }
      return true;
    },
    `${task.id}: ${outcome.kind === 'ready' ? 'design ready' : outcome.kind === 'reject' ? 'rejected by architect' : 'design attempt failed'}`,
  );
  if (!pushed) warn(`${task.id}: could not record the design (the claim was lost or the task changed upstream)`);
  else if (outcome.kind === 'ready') info(`${task.id}: design ready${outcome.dependsOn.length ? ` (depends on ${outcome.dependsOn.join(', ')})` : ''}`);
  else warn(`${task.id}: ${outcome.kind === 'reject' ? `rejected: ${outcome.reason}` : `no usable design (${outcome.reason})`}`);
}

/** On runner start: give back design claims this machine held when it stopped. */
export async function releaseOwnDesignClaims(ctx: Pick<RunContext, 'git' | 'local'>, machineIds: readonly string[]): Promise<void> {
  const me = ctx.local.machineId;
  for (const t of listTasks(machineIds).tasks.filter((x) => x.status === 'designing' && x.extra.designer === me)) {
    warn(`${t.id} was being designed when the runner stopped; releasing the claim`);
    await updateTaskAndPush(
      ctx.git,
      rel(t.file),
      (task) => {
        if (task.status !== 'designing' || task.extra.designer !== me) return false;
        task.status = 'design';
        task.claimedAt = undefined;
        delete task.extra.designer;
        return true;
      },
      `${t.id}: design claim released by ${me}`,
    );
  }
}
