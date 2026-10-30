/** The chance a pellet of a Spray blast deals double damage (T0299). */
export const SPRAY_CRIT_CHANCE = 0.15;

/** One pellet of a Spray blast: `crit` when the roll lands under the chance, that pellet's
 * damage doubled on a crit (the tier's damageMul is already in `normalDamage`). */
export function sprayPelletDamage(normalDamage: number, roll: number): { damage: number; crit: boolean } {
  const crit = roll < SPRAY_CRIT_CHANCE;
  return { damage: crit ? normalDamage * 2 : normalDamage, crit };
}
