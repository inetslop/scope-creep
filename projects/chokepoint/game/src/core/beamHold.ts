import { TICK_SEC } from '../config';

/**
 * A beam line's "tick" (T0281, applied by systems/BeamSystem.ts through EnemySystem.beamTick and
 * beamEffects): while a line holds an enemy it deals one small hit every TICK_SEC — a quarter of
 * its per-second rate — each one an ordinary hit, so crits, slows, marks and burns apply to it
 * like to a shot; every BEAM_PULSE_EVERY ticks of contact on the same enemy the tick is also a
 * pulse (Anchor's root, Push's push), once per second of contact as before, so a root or push
 * never chains forever. Pure — the hold state lives in the system.
 */

/** One beam line's hold: the enemy it holds (undefined: free), its tick clock, and the ticks it
 * has dealt on that enemy so far (the pulse counts every BEAM_PULSE_EVERY of them). */
export interface BeamHold {
  enemy: object | undefined;
  /** [0, TICK_SEC): seconds held since the last tick. */
  acc: number;
  /** Ticks dealt on `enemy` so far. */
  ticks: number;
}

/** A free line. */
export const EMPTY_BEAM_HOLD: BeamHold = { enemy: undefined, acc: 0, ticks: 0 };

/** The tick of contact one pulse (root, push) comes on: once per second of hold. */
export const BEAM_PULSE_EVERY = Math.round(1 / TICK_SEC);

/**
 * One frame of a line's hold: `ticks` is how many ticks the line deals this frame (0 or 1 at a
 * clamped dt, a few in a spike), and `pulse` is true when one of them is the BEAM_PULSE_EVERY-th
 * tick on this enemy. A frame with no enemy, or with a new enemy, deals nothing for the partial
 * tick and starts a fresh clock. `dt` in seconds.
 */
export function beamHoldStep(hold: BeamHold, enemy: object | undefined, dt: number): { ticks: number; pulse: boolean; hold: BeamHold } {
  if (!enemy || hold.enemy !== enemy) return { ticks: 0, pulse: false, hold: enemy ? { enemy, acc: 0, ticks: 0 } : EMPTY_BEAM_HOLD };
  let acc = hold.acc + dt;
  let ticks = 0;
  let pulse = false;
  while (acc >= TICK_SEC) {
    acc -= TICK_SEC;
    ticks += 1;
    if ((hold.ticks + ticks) % BEAM_PULSE_EVERY === 0) pulse = true;
  }
  return { ticks, pulse, hold: { enemy, acc, ticks: hold.ticks + ticks } };
}
