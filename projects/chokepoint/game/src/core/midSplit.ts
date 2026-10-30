import type { EnemyDef } from '../content/types';

/**
 * The mid-life split (the Orb): true when a still-alive enemy's hp has first dropped to its
 * split line — `hpFrac` of its max or below after a hit (a corpse is an ordinary kill, not a split;
 * a single hit from over the line to zero never gets here). Performed by systems/enemyHooks/midSplit.ts.
 */
export function atSplitLine(def: EnemyDef, hp: number, maxHp: number): boolean {
  return def.splitsAt !== undefined && hp > 0 && hp <= maxHp * def.splitsAt.hpFrac;
}

/** The split child's hp: half of the parent's hp after the triggering hit, minimum 1. */
export function splitChildHp(hp: number): number {
  return Math.max(1, Math.floor(hp / 2));
}
