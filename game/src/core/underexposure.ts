/**
 * Underexposure: a hit on a shape below the wound threshold (a fraction of its own max HP) is doubled.
 * `threshold` comes from `run.stats.woundThreshold` (0 = off). The threshold is checked on the HP
 * the target has *before* this hit.
 */
export const WOUND_MULTIPLIER: number = 2;

export function underexposureDamage(threshold: number, hpBefore: number, maxHp: number, damage: number): { damage: number; doubled: boolean } {
  const doubled = threshold > 0 && hpBefore < maxHp * threshold;
  return { damage: doubled ? damage * WOUND_MULTIPLIER : damage, doubled };
}
