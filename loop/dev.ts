import fs from 'node:fs';
import path from 'node:path';
import { runAgent, type AgentRunResult } from './claude.ts';
import { ensureGameDeps, runGate } from './checks.ts';
import { effortFor, type Effort, type FleetConfig, type LocalConfig } from './config.ts';
import type { Git } from './git.ts';
import { info, step, warn } from './log.ts';
import { GAME_DIR, GAME_REL, REPO, SALVAGE_DIR, rel } from './paths.ts';
import { autoResolvable, autoResolveAdditions } from './merge.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { updateTaskAndPush } from './sync.ts';
import { appendSection, isPoolTask, listTasks, lockedBy, lockFreeFor, parseTask, readTask, writeTask, type Task } from './tasks.ts';

export interface RunContext {
  local: LocalConfig;
  fleet: FleetConfig;
  git: Git;
}

/** Reasoning effort for this machine's dev sessions (agents/machines.json). */
const devEffort = (ctx: RunContext): Effort => effortFor(ctx.fleet, ctx.local.machineId, 'dev');

const now = (): string => new Date().toISOString().slice(0, 19) + 'Z';
const GAME = [GAME_REL];
const salvageRel = (id: string): string => rel(path.join(SALVAGE_DIR, `${id}.diff`));

/**
 * One dev task, start to finish:
 *   claim → implement → gate (+ fix rounds) → local commit → self-review → rebase/push
 * Any failure resets the checkout and records the reason in the task file, so the
 * PO sees it. The runner, never the agent, edits task files.
 */
export async function runDevTask(ctx: RunContext, picked: Task): Promise<void> {
  const machine = ctx.local.machineId;
  const taskRel = rel(picked.file);
  const started = Date.now();
  step(`${picked.id} "${picked.title}" (size ${picked.size})`);

  const claimed = await updateTaskAndPush(
    ctx.git,
    taskRel,
    (t) => {
      // Someone else claimed it first (the pool is shared): leave it to them.
      if (t.status !== 'todo' || (t.assignee && t.assignee !== machine)) return false;
      // The pick was made on an older view of main. This runs on the latest one, and again if the
      // push is rejected, so two machines can never both claim tasks that edit the same file.
      const holder = lockedBy(t, listTasks(true).tasks, machine, lockFreeFor(ctx.fleet));
      if (holder) {
        warn(`${t.id}: ${holder.assignee} is building ${holder.id}, which edits the same files; leaving it for now`);
        return false;
      }
      t.status = 'in-progress';
      t.assignee = machine;
      t.attempts += 1;
      t.claimedAt = now();
      t.finishedAt = undefined;
      return true;
    },
    `${picked.id}: claimed by ${machine}`,
  );
  if (!claimed) {
    warn(`${picked.id}: could not claim (changed upstream?); skipping`);
    return;
  }

  const task = readTask(path.join(REPO, taskRel));
  const base = await ctx.git.head();
  const limits = ctx.fleet.sizes[task.size];
  const notes: string[] = [];

  try {
    await ensureGameDeps();

    const deleted = new Set<string>();
    let session = await runAgent(ctx.local, {
      label: `${task.id}-dev`,
      prompt: renderPrompt('dev', {
        TASK_ID: task.id,
        TASK_TITLE: task.title,
        TASK_SIZE: task.size,
        TASK_BODY: task.body,
        MACHINE: ctx.fleet.machines[machine]?.label ?? machine,
        ATTEMPT: task.attempts,
        PREVIOUS_WORK: previousWork(task.id),
      }),
      cwd: GAME_DIR,
      profile: 'dev',
      effort: devEffort(ctx),
      maxTurns: limits.maxTurns,
      timeoutMin: limits.timeoutMin,
    });
    await enforce(ctx, notes);
    applyDeletions(session.result, deleted, notes);

    const blocked = /STATUS:\s*BLOCKED:?\s*(.*)/i.exec(session.result);
    if (blocked) return await fail(ctx, task, `The agent reported it is blocked: ${blocked[1] || '(no reason given)'}`, session.result, notes);
    if (!(await hasGameChanges(ctx.git))) {
      return await fail(ctx, task, `The agent made no changes to the game (${session.subtype}).`, session.result, notes);
    }

    let gate = await runGate(ctx.fleet.loop.smokeSeconds);
    for (let round = 1; !gate.ok && round <= ctx.fleet.loop.fixRounds; round++) {
      notes.push(`Gate failed at "${gate.stage}"; fix round ${round}.`);
      session = await fixRound(ctx, task, session, gate.stage, gate.output, round);
      await enforce(ctx, notes);
      applyDeletions(session.result, deleted, notes);
      gate = await runGate(ctx.fleet.loop.smokeSeconds);
    }
    if (!gate.ok) {
      return await fail(ctx, task, `Checks still failing at "${gate.stage}" after ${ctx.fleet.loop.fixRounds} fix round(s).`, gate.output, notes);
    }

    const summary = extractSummary(session.result);
    await ctx.git.commitPaths(GAME, `${task.id}: ${task.title}`);

    const verdict = ctx.fleet.loop.review ? await selfReview(ctx, task, base, notes) : 'skipped';

    const stat = await ctx.git.ok(['diff', '--stat', base, 'HEAD', '--', GAME_REL]);
    task.status = 'done';
    task.finishedAt = now();
    appendSection(
      task,
      `Result (attempt ${task.attempts}, ${machine})`,
      [
        summary,
        '',
        `- Self-review: ${verdict}`,
        `- Time: ${((Date.now() - started) / 60_000).toFixed(1)} min`,
        ...notes.map((n) => `- ${n}`),
        '',
        '```',
        stat,
        '```',
      ].join('\n'),
    );
    writeTask(task);
    await ctx.git.amendPaths([taskRel]);

    // Kept in case it can't be merged: the next attempt re-applies it instead of starting over.
    const work = await ctx.git.ok(['diff', base, 'HEAD', '--', GAME_REL]);
    const workFiles = (await ctx.git.ok(['diff', '--name-only', base, 'HEAD', '--', GAME_REL])).split(/\r?\n/).filter(Boolean);

    const outcome = await integrate(ctx, task, notes, machine);
    if (outcome === 'released') return await savePastClaim(ctx, task, machine, base, work, workFiles);
    if (outcome !== 'pushed') {
      const upstream = await upstreamLog(ctx.git, base, workFiles);
      const header = `${task.id} attempt ${task.attempts} (${machine}) passed the checks on ${base.slice(0, 7)} but could not be merged into main (${outcome}).`;
      return await fail(ctx, task, `Could not merge into main (${outcome}). The work was saved to ${salvageRel(task.id)}; the next attempt re-applies it on the latest code.`, '', notes, {
        [salvageRel(task.id)]: salvageText(header, upstream, work),
      });
    }
    info(`${task.id}: done and pushed (${((Date.now() - started) / 60_000).toFixed(1)} min)`);
  } catch (err) {
    const e = err as Error;
    await fail(ctx, task, `Runner error: ${e.message}`, e.stack ?? '', notes);
  }
}

async function enforce(ctx: RunContext, notes: string[]): Promise<void> {
  const reverted = await enforceWritable(ctx.git, 'dev');
  if (reverted.length > 0) {
    warn(`reverted ${reverted.length} change(s) outside ${GAME_REL}: ${reverted.join(', ')}`);
    notes.push(`Reverted changes outside the game: ${reverted.join(', ')}`);
  }
}

/** Folders of the game an agent may have the runner delete files from. */
const DELETABLE = ['src/', 'tests/', 'docs/', 'public/'];

/**
 * The files a dev agent asks the runner to delete: one `DELETE: <path in the game folder>` line per
 * file in its final message. Agents can't delete files themselves (rm is always denied), so a
 * removal task used to leave an emptied stub file behind.
 */
export function deletionRequests(result: string): string[] {
  return [...new Set([...result.matchAll(/^\s*DELETE:\s*`?([^`\s]+)`?\s*$/gim)].map((m) => m[1]!.replace(/^\.\//, '')))];
}

/** Why a requested deletion is refused, or null if it's fine: only a file inside the game's code folders. */
export function deletionProblem(gameDir: string, rel: string): string | null {
  const inside = path.relative(gameDir, path.resolve(gameDir, rel));
  if (inside.startsWith('..') || path.isAbsolute(inside)) return 'outside the game folder';
  if (!DELETABLE.some((d) => inside.split(path.sep).join('/').startsWith(d))) return `only files in ${DELETABLE.join(', ')} can be deleted`;
  const abs = path.join(gameDir, inside);
  if (!fs.existsSync(abs)) return 'no such file';
  if (!fs.lstatSync(abs).isFile()) return 'not a file';
  return null;
}

/** Deletes the files the agent asked for (deletionRequests), each at most once, and notes what it did. */
function applyDeletions(result: string, deleted: Set<string>, notes: string[]): void {
  for (const rel of deletionRequests(result)) {
    if (deleted.has(rel)) continue;
    const problem = deletionProblem(GAME_DIR, rel);
    if (problem) {
      notes.push(`Did not delete ${rel}: ${problem}.`);
      continue;
    }
    fs.rmSync(path.join(GAME_DIR, rel));
    deleted.add(rel);
    notes.push(`Deleted ${rel}, as the agent asked.`);
  }
}

async function hasGameChanges(git: Git): Promise<boolean> {
  return (await git.changedPaths()).some((c) => c.path.startsWith(GAME_REL));
}

function fixRound(ctx: RunContext, task: Task, session: AgentRunResult, stage: string, output: string, round: number): Promise<AgentRunResult> {
  const limits = ctx.fleet.sizes[task.size];
  return runAgent(ctx.local, {
    label: `${task.id}-fix${round}`,
    prompt: renderPrompt('fix', { TASK_ID: task.id, TASK_TITLE: task.title, STAGE: stage, OUTPUT: output, ROUND: round }),
    cwd: GAME_DIR,
    profile: 'dev',
    effort: devEffort(ctx),
    maxTurns: Math.ceil(limits.maxTurns / 2),
    timeoutMin: limits.timeoutMin,
    resumeSessionId: session.sessionId,
  });
}

/** Fresh-context review of the committed change. Fixes are kept only if the gate still passes. */
async function selfReview(ctx: RunContext, task: Task, base: string, notes: string[]): Promise<string> {
  const limits = ctx.fleet.sizes[task.size];
  let diff = await ctx.git.ok(['diff', base, 'HEAD', '--', GAME_REL]);
  if (diff.length > 40_000) diff = diff.slice(0, 40_000) + '\n… (diff truncated)';
  const review = await runAgent(ctx.local, {
    label: `${task.id}-review`,
    prompt: renderPrompt('review', { TASK_ID: task.id, TASK_TITLE: task.title, TASK_BODY: task.body, DIFF: diff }),
    cwd: GAME_DIR,
    profile: 'dev',
    effort: devEffort(ctx),
    maxTurns: ctx.fleet.loop.reviewMaxTurns,
    timeoutMin: limits.timeoutMin,
  });
  await enforce(ctx, notes);
  const match = /VERDICT:\s*(APPROVE|REJECT)\b:?\s*(.*)/i.exec(review.result);
  const verdict = match ? match[1]!.toUpperCase() : 'NO VERDICT';
  if (await hasGameChanges(ctx.git)) {
    const gate = await runGate(ctx.fleet.loop.smokeSeconds);
    if (gate.ok) {
      await ctx.git.amendPaths(GAME);
      notes.push('Self-review made fixes (kept; checks pass).');
    } else {
      await ctx.git.discard(GAME);
      notes.push(`Self-review edits were discarded (checks failed at "${gate.stage}").`);
    }
  }
  if (verdict === 'REJECT') notes.push(`Self-review concerns: ${match?.[2]?.trim() || '(none given)'}`);
  return verdict;
}

/** Rebases onto the latest main (agent resolves game conflicts), re-runs the gate if needed, pushes. */
async function integrate(ctx: RunContext, task: Task, notes: string[], machine: string): Promise<'pushed' | 'released' | 'conflict' | 'broken-after-rebase' | 'push-failed'> {
  const git = ctx.git;
  let recorded = notes.length; // the notes before this point are in the task's Result section already
  for (let attempt = 1; attempt <= 3; attempt++) {
    await git.fetch();
    if (!(await stillMine(git, task, machine))) return 'released';
    if ((await git.behindCount()) > 0) {
      const upstreamGame = (await git.ok(['diff', '--name-only', 'HEAD...origin/main', '--', GAME_REL])).trim() !== '';
      const mine = await git.head();
      if ((await git.rebase()) === 'conflict') {
        const unresolved = await resolveConflicts(ctx, task, mine, notes);
        if (unresolved) {
          notes.push(`Could not resolve them: ${unresolved}.`);
          await git.abortRebase();
          return 'conflict';
        }
      }
      if (upstreamGame) {
        const gate = await runGate(ctx.fleet.loop.smokeSeconds);
        if (!gate.ok) {
          notes.push(`After rebasing onto newer main the gate failed at "${gate.stage}".`);
          return 'broken-after-rebase';
        }
      }
    }
    if (notes.length > recorded) {
      // How the merge went (conflicts and who resolved them) goes into the task file with the work.
      const merged = readTask(task.file);
      appendSection(merged, `Merge (attempt ${task.attempts}, ${machine})`, notes.slice(recorded).map((n) => `- ${n}`).join('\n'));
      writeTask(merged);
      await git.amendPaths([rel(task.file)]);
      recorded = notes.length;
    }
    if ((await git.push()).code === 0) return 'pushed';
    warn(`${task.id}: push rejected (attempt ${attempt}); retrying`);
  }
  return 'push-failed';
}

/** Whether main still has `task` in progress by `machine` (the PO machine requeues the tasks of a machine paused too long). */
async function stillMine(git: Git, task: Task, machine: string): Promise<boolean> {
  const shown = await git.raw(['show', `origin/main:${rel(task.file)}`]);
  if (shown.code !== 0) return true; // gone from main: left to the usual merge, as before
  const upstream = parseTask(shown.stdout, task.file);
  return upstream.status === 'in-progress' && upstream.assignee === machine;
}

/**
 * The task was put back in the pool while this machine built it (paused for over an hour): its
 * work passed the checks but is not pushed over the new claim. It is saved to tasks/salvage/ for
 * whoever builds the task (an attempt re-applies a saved diff), and noted on the task.
 */
async function savePastClaim(ctx: RunContext, task: Task, machine: string, base: string, work: string, workFiles: string[]): Promise<void> {
  warn(`${task.id}: was put back in the pool while this machine built it; saving the work to ${salvageRel(task.id)} instead of pushing`);
  const upstream = await upstreamLog(ctx.git, base, workFiles);
  const header = `${task.id} attempt ${task.attempts} (${machine}) passed the checks on ${base.slice(0, 7)} after the task had gone back to the pool (the machine was paused).`;
  await ctx.git.abortRebase();
  await updateTaskAndPush(
    ctx.git,
    rel(task.file),
    (t) => {
      appendSection(t, `Late work (attempt ${task.attempts}, ${machine})`, `This machine finished the task after it went back to the pool. Its work passed the checks and is saved in ${salvageRel(task.id)} for the next attempt to re-apply.`);
      return true;
    },
    `${task.id}: late work from ${machine} saved`,
    { [salvageRel(task.id)]: salvageText(header, upstream, work) },
  );
}

/**
 * Lets an agent resolve rebase conflicts in the game, telling it which commits on main caused them.
 * `mine` is our commit before the rebase. Returns null once the rebase is through, else why not.
 */
async function resolveConflicts(ctx: RunContext, task: Task, mine: string, notes: string[]): Promise<string | null> {
  const git = ctx.git;
  let agentRan = false;
  let gitSaid = '';
  for (let round = 0; round < 3 && git.isRebasing(); round++) {
    let files = await git.conflictedFiles();
    if (files.length > 0) {
      const outside = files.filter((f) => !f.startsWith(GAME_REL));
      if (outside.length) return `conflicts outside the game in ${outside.join(', ')}`;
      notes.push(`Conflicts in: ${files.join(', ')}`);
      files = await autoResolve(git, files, notes);
    }
    if (files.length > 0) {
      agentRan = true;
      const session = await runAgent(ctx.local, {
        label: `${task.id}-conflict`,
        prompt: renderPrompt('conflict', {
          TASK_ID: task.id,
          TASK_TITLE: task.title,
          TASK_BODY: task.body,
          FILES: files.map((f) => `- ${f.slice(GAME_REL.length)}`).join('\n'),
          UPSTREAM: await upstreamLog(git, mine, files),
        }),
        cwd: GAME_DIR,
        profile: 'dev',
        effort: devEffort(ctx),
        maxTurns: 40,
        timeoutMin: 60,
      });
      const marked = files.filter((f) => {
        const abs = path.join(REPO, f);
        return fs.existsSync(abs) && /^(<{7}|\|{7}|>{7}|={7})/m.test(fs.readFileSync(abs, 'utf8'));
      });
      if (marked.length) return `conflict markers left in ${marked.join(', ')} (agent: ${session.subtype})`;
    }
    // Stage every change in the game, not just the conflicted files: to make the checks pass the
    // agent may have changed other files too, and git will not continue past unstaged edits.
    await git.ok(['add', '-A', '--', GAME_REL]);
    const next = await git.continueRebase();
    if (next.status === 'ok' && !git.isRebasing()) {
      notes.push(agentRan ? 'The conflict agent resolved them.' : 'Resolved without the conflict agent.');
      return null;
    }
    gitSaid = next.output;
  }
  if (!git.isRebasing()) return null;
  const said = gitSaid.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 3).join(' / ');
  return `git could not continue the rebase after 3 rounds${said ? ` (git: ${said.slice(0, 300)})` : ''}`;
}

/**
 * Resolves the hunks where main and our commit both only added lines (merge.ts), stages the files
 * that are then clean, and returns the files that still need the conflict agent.
 */
async function autoResolve(git: Git, files: readonly string[], notes: string[]): Promise<string[]> {
  let resolved = 0;
  const clean: string[] = [];
  for (const f of files.filter(autoResolvable)) {
    const abs = path.join(REPO, f);
    if (!fs.existsSync(abs)) continue;
    const r = autoResolveAdditions(fs.readFileSync(abs, 'utf8'));
    if (r.resolved === 0) continue;
    fs.writeFileSync(abs, r.text);
    resolved += r.resolved;
    if (r.remaining === 0) clean.push(f);
  }
  if (clean.length) await git.ok(['add', '--', ...clean]);
  if (resolved) notes.push(`Auto-resolved ${resolved} spot(s) where both sides only added lines${clean.length ? ` (clean: ${clean.join(', ')})` : ''}.`);
  return files.filter((f) => !clean.includes(f));
}

/**
 * Commits on main after `since` that touch `files`, with their messages, so an agent fitting
 * older work onto newer code knows what changed and why.
 */
async function upstreamLog(git: Git, since: string, files: readonly string[]): Promise<string> {
  if (files.length === 0) return '(none)';
  const log = await git.ok(['log', '--format=- %h %an: %s%n%w(0,2,2)%b', `${since}..origin/main`, '--', ...files]);
  return formatUpstreamLog(log);
}

/** Drops commit trailers and blank runs from a `git log` of upstream commits, capped in length. */
export function formatUpstreamLog(log: string): string {
  const text = log
    .split(/\r?\n/)
    .filter((l) => !/^\s*(Co-Authored-By|Claude-Session):/i.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return '(none)';
  return text.length > 6000 ? `${text.slice(0, 6000)}\n… (truncated)` : text;
}

/** tasks/salvage/<id>.diff: a header and the upstream commits as # comments, then the diff (git apply skips the comments). */
export function salvageText(header: string, upstream: string, diff: string): string {
  const comments = [header, 'Commits on main since then that touch the same files:', ...upstream.split('\n')].map((l) => `# ${l}`.trimEnd());
  return `${comments.join('\n')}\n\n${diff}\n`;
}

/** Prompt section that hands a retry the work of an attempt that could not be merged ('' if none). */
function previousWork(id: string): string {
  const file = path.join(REPO, salvageRel(id));
  return fs.existsSync(file) ? previousWorkSection(fs.readFileSync(file, 'utf8')) : '';
}

export function previousWorkSection(saved: string): string {
  let text = saved.trim();
  if (text.length > 60_000) text = `${text.slice(0, 60_000)}\n… (truncated)`;
  return [
    '# Earlier work to re-apply',
    'An earlier attempt finished this task and passed every check, but main changed underneath it and the work could not be merged. Its diff is below, after the commits on main it collided with. Re-apply that work onto the current code instead of starting over: keep what still fits, adapt it where the code has moved, and do not bring back anything those commits removed on purpose.',
    '',
    '````diff',
    text,
    '````',
  ].join('\n');
}

/** Records a failed attempt: resets the checkout and requeues (or fails) the task. `files` are committed with it. */
async function fail(ctx: RunContext, task: Task, reason: string, output: string, notes: string[], files: Record<string, string> = {}): Promise<void> {
  warn(`${task.id}: ${reason}`);
  const git = ctx.git;
  await git.abortRebase();
  await git.resetHard('HEAD');
  await git.discard(GAME);
  const max = ctx.fleet.loop.maxAttempts;
  const trimmed = output.trim().length > 3000 ? '…' + output.trim().slice(-3000) : output.trim();
  await updateTaskAndPush(
    git,
    rel(task.file),
    (t) => {
      t.status = t.attempts >= max ? 'failed' : 'todo';
      // A pool task goes back for any machine to retry (the attempt above records who tried).
      if (t.status === 'todo' && isPoolTask(t)) t.assignee = '';
      t.finishedAt = now();
      appendSection(
        t,
        `Attempt ${t.attempts} failed (${ctx.local.machineId})`,
        [reason, ...notes.map((n) => `- ${n}`), trimmed ? `\n\`\`\`\n${trimmed}\n\`\`\`` : ''].join('\n'),
      );
      return true;
    },
    `${task.id}: attempt ${task.attempts} failed`,
    files,
  );
}

/** Pulls the SUMMARY: section out of the agent's final message (falls back to the whole message). */
export function extractSummary(result: string): string {
  const match = /SUMMARY:\s*([\s\S]*?)(?:\n\s*STATUS:|$)/i.exec(result);
  const text = (match?.[1] ?? result).replace(/^\s*DELETE:.*$/gim, '').trim();
  return text.length > 1500 ? text.slice(0, 1500) + '…' : text || '(no summary)';
}
