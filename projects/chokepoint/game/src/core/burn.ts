/**
 * The burn (Ember): damage that keeps dealing itself after the hit that set it. Pure rules —
 * the enemy stores its state in a LiveBurn, the ticks come from systems/EnemySystem.
 */

/** What one enemy is burning with: `dps` damage per second for `left` more seconds (left 0: not ablaze). */
export interface LiveBurn {
  dps: number;
  left: number;
}

/**
 * Sets ablaze, or re-ignites: the duration is always `sec`. A fresh ablaze starts at the igniter's
 * rate; a re-ignition of an enemy that is still ablaze keeps the higher of the two — it refreshes,
 * it never adds up (two Commons never make 6/s, a Rare over a Common burns at 4/s). True when the
 * enemy was not ablaze before (that is the moment that whooshes; a refresh is silent).
 */
export function ignite(burn: LiveBurn, dps: number, sec: number): boolean {
  const fresh = burn.left <= 0;
  burn.left = sec;
  burn.dps = fresh ? dps : Math.max(burn.dps, dps);
  return fresh;
}

/** One frame: the damage dealt over the seconds still ablaze this tick (0 when spent). */
export function burnTick(burn: LiveBurn, dt: number): number {
  if (burn.left <= 0) return 0;
  const sec = Math.min(burn.left, dt);
  burn.left -= sec;
  return burn.dps * sec;
}
