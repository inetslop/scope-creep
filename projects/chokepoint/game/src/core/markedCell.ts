import { kindAt, type Cell, type GameMap } from './map';
import { Rng } from './rng';

/** A tower built on the board's one marked cell deals this much more damage (1 + 25%). */
export const MARKED_DMG_MUL = 1.25;

/**
 * The board's one marked cell: one of its 'open' build cells, picked from the board's own seed
 * (a fresh Rng, never the run's, so no other seeded draw of the run moves), so the same seed
 * regrows the same board and the same cell (a resumed run re-derives it).
 */
export function markedCell(map: GameMap, seed: number): Cell {
  const opens: Cell[] = [];
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (kindAt(map, col, row) === 'open') opens.push({ col, row });
    }
  }
  return opens[new Rng(seed).int(0, opens.length - 1)]!;
}
