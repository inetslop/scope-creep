import { getAugment } from '../content/augments';
import type { Cell } from './map';

/** How many cells around a Rally tower it reaches (a 5x5 square at 2). */
export const RALLY_RANGE: number = getAugment('rally').first.range;

/** The flat attack-speed buff Rally grants (it never stacks, so this is all it is). */
export const RALLY_PCT: number = getAugment('rally').added.rally?.pct ?? 0;

/** Chebyshev distance: the rally reaches a square around the tower, not a circle. */
export function inRallyReach(a: Cell, b: Cell, range: number): boolean {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row)) <= range;
}

/**
 * Which towers a rally speeds up, for a set of towers standing on `cells`:
 * `rally[i]` has a Rally in it (it grants the buff and joins its own rally), `attacks[i]` deals
 * damage (a lone beacon has none, so it shows no chevron). The result is a boolean, so a tower
 * in reach of several Rally towers still gains the buff only once.
 */
export function rallyBuffed(cells: readonly Cell[], rally: readonly boolean[], attacks: readonly boolean[], range: number): boolean[] {
  return cells.map((c, i) => {
    if (!attacks[i]!) return false;
    if (rally[i]!) return true;
    return cells.some((o, j) => j !== i && rally[j]! && inRallyReach(c, o, range));
  });
}
