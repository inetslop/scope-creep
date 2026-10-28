import type { TowerSpec } from './augments';
import type { Cell } from './map';

/** Where a tower stands and what it is (a structural copy of entities/Tower; core never imports entities/). */
export interface MintTower {
  cell: Cell;
  spec: TowerSpec;
}

/** Chebyshev distance between cells: a mint reaches a square around the tower, not a circle. */
export function chebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

/**
 * Extra gold a kill at `cell` pays beyond the enemy's own: each tower that has mints in it pays
 * its copies once, if the kill is the tower's own (`source`) or within one of its mint radii.
 * Copies never pay twice for the same kill (systems/EnemySystem.ts shows the sum in the gold pop).
 */
export function mintGoldBonus(towers: readonly MintTower[], cell: Cell, source: MintTower): number {
  let bonus = 0;
  for (const t of towers) {
    if (t.spec.goldPerKill <= 0) continue;
    if (t === source || (t.spec.goldRadius > 0 && chebyshev(t.cell, cell) <= t.spec.goldRadius)) bonus += t.spec.goldPerKill;
  }
  return bonus;
}
