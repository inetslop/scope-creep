import type { EnemyDef } from '../content/types';

/** The shielded factor: while its carrier lives, every hit on the shield-bearer lands at half. */
export const SHIELD_MUL = 0.5;

/** 0.5 only for a shield-carrying enemy whose shield is up; the caller multiplies it last (after the plate, after the mark). */
export function shieldMul(def: EnemyDef, shielded: boolean): number {
  return def.shieldCarrier !== undefined && shielded ? SHIELD_MUL : 1;
}
