/**
 * A beam line's "hit" (T0132, applied by systems/BeamSystem.ts through EnemySystem.beamEffects):
 * while a line holds an enemy, its contact effects (Frost's slow, Mark's mark, Ember's ablaze)
 * apply every frame; once per second of contact on the same enemy — first at the moment of lock —
 * the line takes a pulse (Anchor's root, Push's push), so a root or push never chains forever.
 * Pure — the hold state lives in the system.
 */

/** One beam hit: the seconds of contact on the same enemy between two pulses. */
export const BEAM_HIT_SEC = 1;

/** One beam line's hold: the enemy it holds (undefined: free), and the seconds to its next pulse. */
export interface BeamHold {
  enemy: object | undefined;
  nextHit: number;
}

/** A free line: its first lock is a pulse at once. */
export const EMPTY_BEAM_HOLD: BeamHold = { enemy: undefined, nextHit: BEAM_HIT_SEC };

/**
 * One frame of a line's hold. `contact` is true while the line holds `enemy` (its contact effects
 * apply on every such frame); `pulse` is true on the frame it locks `enemy` and then once per
 * BEAM_HIT_SEC of contact on it. A frame with no enemy, or a new enemy, is a fresh hold.
 * `dt` in seconds.
 */
export function beamHoldStep(hold: BeamHold, enemy: object | undefined, dt: number): { contact: boolean; pulse: boolean; hold: BeamHold } {
  if (!enemy) return { contact: false, pulse: false, hold: EMPTY_BEAM_HOLD };
  if (hold.enemy !== enemy) return { contact: true, pulse: true, hold: { enemy, nextHit: BEAM_HIT_SEC } };
  const nextHit = hold.nextHit - dt;
  return nextHit <= 0
    ? { contact: true, pulse: true, hold: { enemy, nextHit: BEAM_HIT_SEC } }
    : { contact: true, pulse: false, hold: { enemy, nextHit } };
}
