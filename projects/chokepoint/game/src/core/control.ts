/**
 * The shared control fatigue, the one rule for every push and root: each push or root on an
 * enemy that just took one is half as strong as the one before, and after
 * `CONTROL_WINDOW_SEC` seconds without any the enemy has recovered. Nothing can lock an enemy
 * in place, and a combo of Push and Anchor wears off too.
 */

/** Seconds without a push or root after which the enemy has recovered. */
export const CONTROL_WINDOW_SEC = 1.5;

/** An enemy's control streak (entities/Enemy has both fields). */
export interface ControlState {
  /** Pushes and roots taken in the current streak; each halves the next one. */
  controlCount: number;
  /** Seconds since the last one; at `CONTROL_WINDOW_SEC` the streak recovers. */
  controlQuietSec: number;
}

/** The strength of the next push or root: 1, 0.5, 0.25, ... down the streak. */
export function controlScale(s: ControlState): number {
  return 0.5 ** s.controlCount;
}

/** Counts a push or root that took effect: the streak grows and the quiet time restarts. */
export function noteControl(s: ControlState): void {
  s.controlCount += 1;
  s.controlQuietSec = 0;
}

/** Runs the streak forward by `dt` seconds: at the window the streak recovers. */
export function tickControl(s: ControlState, dt: number): void {
  if (s.controlCount <= 0) return;
  s.controlQuietSec += dt;
  if (s.controlQuietSec >= CONTROL_WINDOW_SEC) {
    s.controlCount = 0;
    s.controlQuietSec = 0;
  }
}
