import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { run, runOk, tail } from './exec.ts';
import { info } from './log.ts';
import { GAME_DIR, REPO } from './paths.ts';
import { loadState, saveState } from './state.ts';

export interface GateResult {
  ok: boolean;
  stage: 'check' | 'smoke' | 'passed';
  /** Tail of the failing command's output (fed back to the agent). */
  output: string;
  durationMs: number;
}

/** Runs `npm ci` in game/ when game/package-lock.json changed since the last install. */
export async function ensureGameDeps(): Promise<void> {
  const lock = path.join(GAME_DIR, 'package-lock.json');
  const hash = createHash('sha1').update(fs.readFileSync(lock)).digest('hex');
  const state = loadState();
  if (state.gameDepsHash === hash && fs.existsSync(path.join(GAME_DIR, 'node_modules'))) return;
  info('installing game dependencies (npm ci)…');
  await runOk('npm', ['ci', '--no-audit', '--no-fund'], { cwd: GAME_DIR, shell: true, timeoutMs: 15 * 60_000 });
  saveState({ ...loadState(), gameDepsHash: hash });
}

/**
 * The merge gate. Owned by the loop, not the game:
 *   1. `npm run check` in game/ (typecheck + lint + unit tests)
 *   2. loop/smoke/smoke.ts: build, run the game in a real browser (desktop + mobile), fail on any error
 */
export async function runGate(smokeSeconds: number): Promise<GateResult> {
  const started = Date.now();
  info('gate: npm run check');
  const check = await run('npm', ['run', 'check'], { cwd: GAME_DIR, shell: true, timeoutMs: 15 * 60_000 });
  if (check.code !== 0) {
    return { ok: false, stage: 'check', output: tail(`${check.stdout}\n${check.stderr}`, 120, 8000), durationMs: Date.now() - started };
  }
  info(`gate: browser smoke test (${smokeSeconds}s)`);
  const smoke = await run(process.execPath, [path.join(REPO, 'loop', 'smoke', 'smoke.ts'), '--seconds', String(smokeSeconds)], {
    cwd: REPO,
    timeoutMs: 10 * 60_000,
  });
  if (smoke.code !== 0) {
    return { ok: false, stage: 'smoke', output: tail(`${smoke.stdout}\n${smoke.stderr}`, 120, 8000), durationMs: Date.now() - started };
  }
  info(`gate: passed in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  return { ok: true, stage: 'passed', output: tail(smoke.stdout, 20, 2000), durationMs: Date.now() - started };
}
