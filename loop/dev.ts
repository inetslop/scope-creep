import fs from 'node:fs';
import path from 'node:path';
import { runAgent, type AgentRunResult } from './claude.ts';
import { ensureGameDeps, runGate } from './checks.ts';
import { effortFor, type Effort, type FleetConfig, type LocalConfig } from './config.ts';
import type { Git } from './git.ts';
import { info, step, warn } from './log.ts';
import { GAME_DIR, REPO, rel } from './paths.ts';
import { renderPrompt } from './prompts.ts';
import { enforceWritable } from './sandbox.ts';
import { updateTaskAndPush } from './sync.ts';
import { appendSection, readTask, writeTask, type Task } from './tasks.ts';

export interface RunContext {
  local: LocalConfig;
  fleet: FleetConfig;
  git: Git;
}

/** Reasoning effort for this machine's dev sessions (agents/machines.json). */
const devEffort = (ctx: RunContext): Effort => effortFor(ctx.fleet, ctx.local.machineId, 'dev');

const now = (): string => new Date().toISOString().slice(0, 19) + 'Z';
const GAME = ['game/'];

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
      if (t.status !== 'todo') return false;
      t.status = 'in-progress';
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

    let session = await runAgent(ctx.local, {
      label: `${task.id}-dev`,
      prompt: renderPrompt('dev', {
        TASK_ID: task.id,
        TASK_TITLE: task.title,
        TASK_SIZE: task.size,
        TASK_BODY: task.body,
        MACHINE: ctx.fleet.machines[machine]?.label ?? machine,
        ATTEMPT: task.attempts,
      }),
      cwd: GAME_DIR,
      profile: 'dev',
      effort: devEffort(ctx),
      maxTurns: limits.maxTurns,
      timeoutMin: limits.timeoutMin,
    });
    await enforce(ctx, notes);

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
      gate = await runGate(ctx.fleet.loop.smokeSeconds);
    }
    if (!gate.ok) {
      return await fail(ctx, task, `Checks still failing at "${gate.stage}" after ${ctx.fleet.loop.fixRounds} fix round(s).`, gate.output, notes);
    }

    const summary = extractSummary(session.result);
    await ctx.git.commitPaths(GAME, `${task.id}: ${task.title}`);

    const verdict = ctx.fleet.loop.review ? await selfReview(ctx, task, base, notes) : 'skipped';

    const stat = await ctx.git.ok(['diff', '--stat', base, 'HEAD', '--', 'game/']);
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

    const outcome = await integrate(ctx, task, notes);
    if (outcome !== 'pushed') return await fail(ctx, task, `Could not merge into main (${outcome}). The work was discarded; retry on the latest code.`, '', notes);
    info(`${task.id}: done and pushed (${((Date.now() - started) / 60_000).toFixed(1)} min)`);
  } catch (err) {
    const e = err as Error;
    await fail(ctx, task, `Runner error: ${e.message}`, e.stack ?? '', notes);
  }
}

async function enforce(ctx: RunContext, notes: string[]): Promise<void> {
  const reverted = await enforceWritable(ctx.git, 'dev');
  if (reverted.length > 0) {
    warn(`reverted ${reverted.length} change(s) outside game/: ${reverted.join(', ')}`);
    notes.push(`Reverted changes outside the game: ${reverted.join(', ')}`);
  }
}

async function hasGameChanges(git: Git): Promise<boolean> {
  return (await git.changedPaths()).some((c) => c.path.startsWith('game/'));
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
  let diff = await ctx.git.ok(['diff', base, 'HEAD', '--', 'game/']);
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
async function integrate(ctx: RunContext, task: Task, notes: string[]): Promise<'pushed' | 'conflict' | 'broken-after-rebase' | 'push-failed'> {
  const git = ctx.git;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await git.fetch();
    if ((await git.behindCount()) > 0) {
      const upstreamGame = (await git.ok(['diff', '--name-only', 'HEAD...origin/main', '--', 'game/'])).trim() !== '';
      if ((await git.rebase()) === 'conflict' && !(await resolveConflicts(ctx, task, notes))) {
        await git.abortRebase();
        return 'conflict';
      }
      if (upstreamGame) {
        const gate = await runGate(ctx.fleet.loop.smokeSeconds);
        if (!gate.ok) {
          notes.push(`After rebasing onto newer main the gate failed at "${gate.stage}".`);
          return 'broken-after-rebase';
        }
      }
    }
    if ((await git.push()).code === 0) return 'pushed';
    warn(`${task.id}: push rejected (attempt ${attempt}); retrying`);
  }
  return 'push-failed';
}

async function resolveConflicts(ctx: RunContext, task: Task, notes: string[]): Promise<boolean> {
  const git = ctx.git;
  for (let round = 0; round < 3 && git.isRebasing(); round++) {
    const files = await git.conflictedFiles();
    if (files.length > 0) {
      if (files.some((f) => !f.startsWith('game/'))) return false;
      notes.push(`Resolved merge conflicts in: ${files.join(', ')}`);
      await runAgent(ctx.local, {
        label: `${task.id}-conflict`,
        prompt: renderPrompt('conflict', { TASK_ID: task.id, TASK_TITLE: task.title, FILES: files.map((f) => `- ${f.replace(/^game\//, '')}`).join('\n') }),
        cwd: GAME_DIR,
        profile: 'dev',
        effort: devEffort(ctx),
        maxTurns: 40,
        timeoutMin: 60,
      });
      for (const f of files) {
        const abs = path.join(REPO, f);
        if (fs.existsSync(abs) && /^(<{7}|>{7}|={7})/m.test(fs.readFileSync(abs, 'utf8'))) return false;
      }
      await git.ok(['add', '-A', '--', ...files]);
    }
    if ((await git.continueRebase()) === 'ok' && !git.isRebasing()) return true;
  }
  return !git.isRebasing();
}

/** Records a failed attempt: resets the checkout and requeues (or fails) the task. */
async function fail(ctx: RunContext, task: Task, reason: string, output: string, notes: string[]): Promise<void> {
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
      t.finishedAt = now();
      appendSection(
        t,
        `Attempt ${t.attempts} failed (${ctx.local.machineId})`,
        [reason, ...notes.map((n) => `- ${n}`), trimmed ? `\n\`\`\`\n${trimmed}\n\`\`\`` : ''].join('\n'),
      );
      return true;
    },
    `${task.id}: attempt ${task.attempts} failed`,
  );
}

/** Pulls the SUMMARY: section out of the agent's final message (falls back to the whole message). */
export function extractSummary(result: string): string {
  const match = /SUMMARY:\s*([\s\S]*?)(?:\n\s*STATUS:|$)/i.exec(result);
  const text = (match?.[1] ?? result).trim();
  return text.length > 1500 ? text.slice(0, 1500) + '…' : text || '(no summary)';
}
