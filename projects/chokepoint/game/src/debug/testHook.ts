/**
 * window.__SC__ — the contract between the game and the smoke test (loop/smoke/).
 *
 * The smoke test fails if: `ready` never becomes true, `scene` never becomes 'Game', `frame`
 * stops advancing, `errors` is non-empty, `invariants()` returns any messages, or after playing
 * `stats.towersBuilt`, `stats.enemiesSpawned` or `stats.shotsFired` is still 0. It plays by
 * clicking (desktop) or tapping (phone) at random spots and at `buildSpots()`. When you add a
 * system, register an invariant for anything that would mean "the game is broken" (NaN
 * positions, negative gold, runaway object counts...). Keep checks cheap.
 */
export interface HookStats {
  runsStarted: number;
  runsLost: number;
  wavesStarted: number;
  wavesCleared: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  enemiesLeaked: number;
  towersBuilt: number;
  augmentsPlaced: number;
  slotsUnlocked: number;
  /** Tower attacks: bolt volleys plus pulses. */
  shotsFired: number;
  /** Augments picked in the draft. */
  augmentsTaken: number;
  /** Live values from the current run. */
  wave: number;
  gold: number;
  lives: number;
  enemiesAlive: number;
  towers: number;
  /** Board zoom, as a multiple of the zoom that fits the whole board. */
  zoom: number;
  /** The wave's speed: 1 or 2 (fast-forward). */
  speed: number;
}

/** Returns an error message when something is wrong, otherwise null/undefined. */
export type InvariantCheck = () => string | null | undefined;

export interface ScreenPoint {
  x: number;
  y: number;
}

export class TestHook {
  readonly sha: string = __BUILD_SHA__;
  ready = false;
  /** Key of the main scene currently shown (Menu, Game, GameOver...). */
  scene = 'none';
  /** Overlay scene on top of the main scene, if any (Draft, Pause). */
  overlay = '';
  frame = 0;
  errors: string[] = [];
  stats: HookStats = {
    runsStarted: 0,
    runsLost: 0,
    wavesStarted: 0,
    wavesCleared: 0,
    enemiesSpawned: 0,
    enemiesKilled: 0,
    enemiesLeaked: 0,
    towersBuilt: 0,
    augmentsPlaced: 0,
    slotsUnlocked: 0,
    shotsFired: 0,
    augmentsTaken: 0,
    wave: 0,
    gold: 0,
    lives: 0,
    enemiesAlive: 0,
    towers: 0,
    zoom: 1,
    speed: 1,
  };
  private readonly checks = new Map<string, InvariantCheck>();
  private spots: () => ScreenPoint[] = () => [];

  /** Registers (or replaces) a named invariant check. */
  addInvariant(name: string, check: InvariantCheck): void {
    this.checks.set(name, check);
  }

  removeInvariant(name: string): void {
    this.checks.delete(name);
  }

  /** Removes every check; GameScene calls it on shutdown, so checks never outlive a run. */
  clearInvariants(): void {
    this.checks.clear();
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

  /** GameScene tells the hook where good build cells are on screen (see buildSpots). */
  setBuildSpots(fn: () => ScreenPoint[]): void {
    this.spots = fn;
  }

  /** Screen positions (CSS pixels) of open cells beside the path, nearest the entrance first. */
  buildSpots(): ScreenPoint[] {
    try {
      return this.spots();
    } catch {
      return [];
    }
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
