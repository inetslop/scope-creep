import path from 'node:path';
import { runAgent } from './claude.ts';
import { effortFor } from './config.ts';
import type { RunContext } from './dev.ts';
import { info, step, warn } from './log.ts';
import { GAME_DIR, rel } from './paths.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { updateTaskAndPush } from './sync.ts';
import { appendSection, listTasks, type Task } from './tasks.ts';

/**
 * The architect stage: between the PO and the devs. For each task in `design` it reads
 * the code (read-only) and returns a concrete design: files, interfaces, steps, pitfalls,
 * tests. The runner writes it into the task as "## Design" and moves the task to `todo`,
 * where the assignee's dev agent picks it up. Rejections go back to the PO as `failed`.
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

const OPEN = new Set(['design', 'todo', 'in-progress']);
const folderOf = (t: Task): string => path.basename(path.dirname(t.file));

/** Files named in a task's design, so the architect can see what other open tasks will touch. */
function designedFiles(t: Task): string {
  const design = t.body.split(/\n## Design\b/)[1];
  if (!design) return '';
  const files = [...new Set([...design.matchAll(/`((?:src|tests|docs)\/[^`\s]+)`/g)].map((m) => m[1]))];
  return files.length ? ` — touches ${files.slice(0, 8).join(', ')}` : '';
}

/** Designs up to loop.architectMaxPerPass tasks that wait in `design`. Returns how many it handled. */
export async function runArchitectPass(ctx: RunContext): Promise<number> {
  const listing = listTasks(Object.keys(ctx.fleet.machines));
  const pending = listing.tasks
    .filter((t) => t.status === 'design')
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .slice(0, ctx.fleet.loop.architectMaxPerPass);
  for (const task of pending) await designTask(ctx, task, listing.tasks);
  return pending.length;
}

async function designTask(ctx: RunContext, task: Task, all: Task[]): Promise<void> {
  const { fleet, git, local } = ctx;
  const assigneeId = folderOf(task);
  const assignee = fleet.machines[assigneeId];
  step(`${task.id} "${task.title}": architect designing it for ${assigneeId}`);

  const others = all
    .filter((t) => t.id !== task.id && OPEN.has(t.status))
    .map((t) => `- ${t.id} [${t.status}, ${folderOf(t)}] ${t.title}${designedFiles(t)}`)
    .join('\n');
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
    effort: effortFor(fleet, local.machineId, 'architect'),
    maxTurns: fleet.loop.architectMaxTurns,
    timeoutMin: fleet.loop.architectTimeoutMin,
  });
  const reverted = await enforceWritable(git, 'architect');
  if (reverted.length) warn(`the architect changed files; reverted: ${reverted.join(', ')}`);

  const outcome = parseArchitectResult(session.result);
  const known = new Set(all.map((t) => t.id));
  outcome.dependsOn = outcome.dependsOn.filter((d) => d !== task.id && known.has(d));
  const finishedAt = new Date().toISOString().slice(0, 19) + 'Z';
  const pushed = await updateTaskAndPush(
    git,
    rel(task.file),
    (t) => {
      if (t.status !== 'design') return false; // the PO changed or removed it meanwhile
      if (outcome.kind === 'ready') {
        t.status = 'todo';
        t.dependsOn = [...new Set([...t.dependsOn, ...outcome.dependsOn])];
        // Nest the design's own "## " headings under the Design section.
        appendSection(t, `Design (architect, ${local.machineId})`, outcome.design.replace(/^## /gm, '### '));
        return true;
      }
      const attempts = Number(t.extra.design_attempts ?? 0) + 1;
      t.extra.design_attempts = String(attempts);
      if (outcome.kind === 'reject') {
        t.status = 'failed';
        t.finishedAt = finishedAt;
        appendSection(t, `Rejected by architect (${local.machineId})`, outcome.reason);
      } else if (attempts >= fleet.loop.architectMaxAttempts) {
        t.status = 'failed';
        t.finishedAt = finishedAt;
        appendSection(
          t,
          `Architect could not design it (${local.machineId})`,
          `${outcome.reason} after ${attempts} attempt(s). Last output:\n\n\`\`\`\n${session.result.slice(-1500)}\n\`\`\``,
        );
      }
      return true;
    },
    `${task.id}: ${outcome.kind === 'ready' ? 'design ready' : outcome.kind === 'reject' ? 'rejected by architect' : 'design attempt failed'}`,
  );
  if (!pushed) warn(`${task.id}: could not record the design (task changed upstream?)`);
  else if (outcome.kind === 'ready') info(`${task.id}: design ready${outcome.dependsOn.length ? ` (depends on ${outcome.dependsOn.join(', ')})` : ''}`);
  else warn(`${task.id}: ${outcome.kind === 'reject' ? `rejected: ${outcome.reason}` : `no usable design (${outcome.reason})`}`);
}
