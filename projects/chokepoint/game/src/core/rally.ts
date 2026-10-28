import { getAugment } from '../content/augments';
import type { Cell } from './map';

/** How many cells around a Rally tower it reaches: the circle its range ring shows. */
export const RALLY_RANGE: number = getAugment('rally').first.range;

/** The flat attack-speed buff Rally grants (it never stacks, so this is all it is). */
export const RALLY_PCT: number = getAugment('rally').added.rally?.pct ?? 0;

/** The rally reaches a tower whose center is inside its range circle, the same circle the ring shows. */
export function inRallyReach(a: Cell, b: Cell, range: number): boolean {
  const dc = a.col - b.col;
  const dr = a.row - b.row;
  return dc * dc + dr * dr <= range * range;
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
