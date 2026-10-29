import type { Rng } from './rng';

export interface Cell {
  col: number;
  row: number;
}

export type CellKind = 'open' | 'path' | 'rock';

/** One run's board: a grid, and the path enemies walk from the entrance to the exit. */
export interface GameMap {
  cols: number;
  rows: number;
  /** kinds[row][col] */
  kinds: CellKind[][];
  /** Path cells in walking order: the first is on the entrance edge, the last on the exit edge. */
  path: Cell[];
  /** True when the path runs top to bottom (portrait boards), false for left to right. */
  vertical: boolean;
}

/**
 * A new random board. The path enters on one short edge and leaves on the opposite one, going
 * forward in runs of 2-3 cells and turning sideways in between, so it never touches itself.
 * Portrait boards (rows > cols) run top to bottom. `rocks` open cells become unbuildable. With
 * `extraBends` of 1 or more the road starts one bend windier (a sideways step at the entrance).
 * With `lengthMul` above 1 the runs are 1–2 cells, so the road turns more often and comes out
 * about 25% longer (the realized length follows the grid).
 */
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0, lengthMul = 1): GameMap {
  const vertical = rows > cols;
  // Work in "along x across" space, then map to cells.
  const length = vertical ? rows : cols;
  const width = vertical ? cols : rows;
  const toCell = (along: number, across: number): Cell => (vertical ? { col: across, row: along } : { col: along, row: across });

  let across = rng.int(1, width - 2);
  let along = 0;
  const path: Cell[] = [toCell(along, across)];
  if (extraBends >= 1) {
    // The entrance jog: one cell sideways on the entrance row before the first run, so the
    // road's second cell is a turn (one more bend). No rng draw, so the rest keeps this
    // seed's usual draws. Needs width >= 5 (the boards are 8).
    across += 1;
    path.push(toCell(along, across));
  }
  while (along < length - 1) {
    // The long road (lengthMul > 1) takes runs of 1-2 cells, so it turns more often and is ~25% longer.
    const run = lengthMul > 1 ? rng.int(1, 2) : rng.int(2, 3);
    for (let i = 0; i < run && along < length - 1; i++) {
      along++;
      path.push(toCell(along, across));
    }
    if (along >= length - 2) continue;
    // Turn sideways to a lane at least 2 away (if there is one).
    const lanes: number[] = [];
    for (let lane = 1; lane <= width - 2; lane++) if (Math.abs(lane - across) >= 2) lanes.push(lane);
    if (lanes.length === 0) continue;
    const target = rng.pick(lanes);
    const step = Math.sign(target - across);
    while (across !== target) {
      across += step;
      path.push(toCell(along, across));
    }
  }

  const kinds: CellKind[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'open' as CellKind));
  for (const c of path) kinds[c.row]![c.col] = 'path';

  // Rocks: never on the path or right next to the entrance and exit, so the ends stay buildable.
  const ends = [path[0]!, path[path.length - 1]!];
  const candidates: Cell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (kinds[row]![col] !== 'open') continue;
      if (ends.some((e) => Math.abs(e.col - col) <= 1 && Math.abs(e.row - row) <= 1)) continue;
      candidates.push({ col, row });
    }
  }
  for (const c of rng.shuffle(candidates).slice(0, rocks)) kinds[c.row]![c.col] = 'rock';

  return { cols, rows, kinds, path, vertical };
}

/** 1 when the road's second cell is the entrance jog (not one step along the entrance axis), else 0. */
export function mapExtraBends(map: GameMap): number {
  const a = map.path[0]!;
  const b = map.path[1]!;
  const alongStep = map.vertical ? b.row === a.row + 1 : b.col === a.col + 1;
  return alongStep ? 0 : 1;
}

export function kindAt(map: GameMap, col: number, row: number): CellKind | undefined {
  return map.kinds[row]?.[col];
}

/** Open cells next to the path (8 neighbours), nearest the entrance first: where towers do the most. */
export function cellsBesidePath(map: GameMap): Cell[] {
  const seen = new Set<string>();
  const out: Cell[] = [];
  for (const p of map.path) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const col = p.col + dc;
        const row = p.row + dr;
        const key = `${col},${row}`;
        if (seen.has(key) || kindAt(map, col, row) !== 'open') continue;
        seen.add(key);
        out.push({ col, row });
      }
    }
  }
  return out;
}
