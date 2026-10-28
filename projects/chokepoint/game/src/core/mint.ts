import { CELL } from '../config';
import type { TowerSpec } from './augments';
import type { Cell } from './map';
import { cellCenter, type Point } from './path';

/** Where a tower stands and what it is (a structural copy of entities/Tower; core never imports entities/). */
export interface MintTower {
  cell: Cell;
  spec: TowerSpec;
}

/** Whether a kill at `at` (board units) is within `radius` cells of the tower on `cell`: inside the circle its range ring shows. */
export function inMintReach(cell: Cell, at: Point, radius: number): boolean {
  const c = cellCenter(cell, CELL);
  const r = radius * CELL;
  return (at.x - c.x) ** 2 + (at.y - c.y) ** 2 <= r * r;
}

/**
 * Extra gold a kill at `at` (board units) pays beyond the enemy's own: each tower that has mints in it pays
 * its copies once, if the kill is the tower's own (`source`) or within one of its mint radii.
 * Copies never pay twice for the same kill (systems/EnemySystem.ts shows the sum in the gold pop).
 */
export function mintGoldBonus(towers: readonly MintTower[], at: Point, source: MintTower): number {
  let bonus = 0;
  for (const t of towers) {
    if (t.spec.goldPerKill <= 0) continue;
    if (t === source || (t.spec.goldRadius > 0 && inMintReach(t.cell, at, t.spec.goldRadius))) bonus += t.spec.goldPerKill;
  }
  return bonus;
}
