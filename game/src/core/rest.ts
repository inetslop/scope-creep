/**
 * Rest (pure logic). After `windowSec` (30 s) without taking any damage the
 * player is at rest: the next discrete hit (enemy/boss contact or bullet) is
 * fully negated. Any damage restarts the count — including continuous burns
 * (Crop, Gutter, The Press), which are never negated. A negated hit restarts
 * the count too: one free hit per 30 s of peace, never two in a row.
 */
export const REST = { windowSec: 30 } as const;

export class RestState {
  /** Seconds of peace since the last damage of any kind. */
  since = 0;
  /** True while at rest: the next discrete hit is free. */
  covered = false;
  /** Discrete hits negated this run; the HUD pops the REST label when this grows. */
  negations = 0;

  /** Advances the quiet count by dt seconds; flips `covered` at REST.windowSec. */
  tick(dt: number): void {
    this.since += dt;
    this.covered = this.since >= REST.windowSec;
  }

  /** A discrete hit landed. At rest: negated (returns true) and the count restarts exactly. Otherwise returns false and just restarts. */
  discreteHit(): boolean {
    const negated = this.covered;
    this.since = 0;
    this.covered = false;
    if (negated) this.negations += 1;
    return negated;
  }

  /** A continuous burn tick: never negated, restarts the count. */
  burn(): void {
    this.since = 0;
    this.covered = false;
  }
}
