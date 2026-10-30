import { TICK_SEC } from '../config';

/**
 * The burn (Ember): damage that keeps dealing itself after the hit that set it, in ticks (T0281) —
 * one hit every TICK_SEC, each a quarter of its per-second rate times the burning tower's damage
 * multiplier. Pure rules — the enemy stores its state in a LiveBurn, the ticks come from
 * systems/EnemySystem.
 */

/**
 * What one enemy is burning with: `dps` damage per second (the igniter's rate) for `left` more
 * seconds (left 0: not ablaze), multiplied by `mul` — the burning tower's damage multiplier,
 * stored when it was lit, so the burn keeps its strength after the tower changes; `acc` is its
 * tick clock.
 */
export interface LiveBurn {
  dps: number;
  /** The burning tower's damage multiplier when the burn was lit. */
  mul: number;
  /** [0, TICK_SEC): seconds ablaze since the last tick. */
  acc: number;
  left: number;
}

/** The burn's damage per second: its rate times the burning tower's multiplier. */
export function burnRate(burn: LiveBurn): number {
  return burn.dps * burn.mul;
}

/**
 * Sets ablaze, or re-ignites: the duration is always `sec`, at the igniter's rate and multiplier.
 * A fresh ablaze starts there; a re-ignition of an enemy that is still ablaze keeps the hotter of
 * the two — it refreshes, it never adds up (two Commons never make 6/s, a Rare over a Common
 * burns at 4/s). True when the enemy was not ablaze before (that is the moment that whooshes; a
 * refresh is silent).
 */
export function ignite(burn: LiveBurn, dps: number, sec: number, mul: number): boolean {
  const fresh = burn.left <= 0;
  if (fresh || dps * mul >= burnRate(burn)) { burn.dps = dps; burn.mul = mul; }
  burn.left = sec;
  return fresh;
}

/**
 * One frame of the burn: its ticks this frame, one per TICK_SEC ablaze, each worth the burn's
 * rate times TICK_SEC. An empty list when the burn is spent or deals no tick this frame; a spent
 * burn clears its clock, so a re-ignition starts clean.
 */
export function burnStep(burn: LiveBurn, dt: number): number[] {
  if (burn.left <= 0) {
    burn.acc = 0;
    return [];
  }
  const sec = Math.min(dt, burn.left);
  burn.left -= sec;
  burn.acc += sec;
  const out: number[] = [];
  while (burn.acc >= TICK_SEC) {
    burn.acc -= TICK_SEC;
    out.push(burnRate(burn) * TICK_SEC);
  }
  if (burn.left <= 0) burn.acc = 0;
  return out;
}
