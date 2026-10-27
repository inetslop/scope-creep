/**
 * window.__SC__ — the contract between the game and the smoke test (smoke/smoke.ts).
 *
 * The smoke test fails if: `ready` never becomes true, `frame` stops advancing,
 * `errors` is non-empty, or `invariants()` returns any messages. When you add a
 * system, register an invariant for anything that would mean "the game is broken"
 * (NaN positions, negative HP, runaway object counts...). Keep checks cheap.
 */
export interface HookStats {
  runsStarted: number;
  deaths: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  elitesSpawned: number;
  elitesKilled: number;
  bossKills: number;
  gridKills: number;
  shotsFired: number;
  shardsCollected: number;
  upgradesTaken: number;
  cropDamageTaken: number;
  /** Live values from the current run. */
  timeSec: number;
  level: number;
  hp: number;
  maxHp: number;
  enemiesAlive: number;
  /** Screen shake on heavy deaths (smoke test / future settings toggle). */
  screenShake: boolean;
  /** Crescendo bonus actually applied this run: 1.1 while the kill streak is 8+, else 1. */
  streakFireBonus: number;
}

/** Returns an error message when something is wrong, otherwise null/undefined. */
export type InvariantCheck = () => string | null | undefined;

export class TestHook {
  readonly sha: string = __BUILD_SHA__;
  ready = false;
  /** Key of the main scene currently shown (Menu, Game, GameOver...). */
  scene = 'none';
  /** Overlay scene on top of the main scene, if any (LevelUp, Pause). */
  overlay = '';
  frame = 0;
  errors: string[] = [];
  stats: HookStats = {
    runsStarted: 0,
    deaths: 0,
    enemiesSpawned: 0,
    enemiesKilled: 0,
    elitesSpawned: 0,
    elitesKilled: 0,
    bossKills: 0,
    gridKills: 0,
    shotsFired: 0,
    shardsCollected: 0,
    upgradesTaken: 0,
    cropDamageTaken: 0,
    timeSec: 0,
    level: 0,
    hp: 0,
    maxHp: 0,
    enemiesAlive: 0,
    screenShake: true,
    streakFireBonus: 1,
  };
  private readonly checks = new Map<string, InvariantCheck>();

  /** Registers (or replaces) a named invariant check. */
  addInvariant(name: string, check: InvariantCheck): void {
    this.checks.set(name, check);
  }

  removeInvariant(name: string): void {
    this.checks.delete(name);
  }

  /** Runs every check and returns the failures as "name: message". */
  invariants(): string[] {
    const failures: string[] = [];
    for (const [name, check] of this.checks) {
      try {
        const message = check();
        if (message) failures.push(`${name}: ${message}`);
      } catch (err) {
        failures.push(`${name}: threw ${String(err)}`);
      }
    }
    return failures;
  }
}

export const hook = new TestHook();

declare global {
  interface Window {
    __SC__: TestHook;
  }
}

export function installTestHook(): void {
  window.__SC__ = hook;
  window.addEventListener('error', (e) => hook.errors.push(`error: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => hook.errors.push(`unhandledrejection: ${String(e.reason)}`));
}
