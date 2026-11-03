import { ensureChokes } from './choke';
import { boardHasCove, placeCove, type Cove } from './cove';
import { farGateCell } from './farGate';
import { placeFork, type Fork } from './fork';
import { boardHasLoop, placeLoop, type Loop } from './loop';
import { foldSwitchback } from './switchback';
import { boardHasTwin, placeTwin, type Twin } from './twin';
import { boardHasSlowStretch, placeSlowStretch, type SlowStretch } from './slowStretch';
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
  /** The far gate's cell (core/farGate.ts): a second entrance about a third of the way in, on about one board in three. */
  farGate?: Cell;
  /** The fork (core/fork.ts): the road splits into two equal lanes that rejoin before the exit, on about one board in three. */
  fork?: Fork;
  /** The loop (core/loop.ts): the road circles a rounded ring in the middle of the island once, on about one board in four (never with the fork). */
  loop?: Loop;
  /** The cove (core/cove.ts): a bay scooped into the island's edge beside a road curve, a pocket of three build cells facing it, on about one board in six (never with the fork or the loop). */
  cove?: Cove;
  /** The twin (core/twin.ts): a mirror pair of ordinary build cells at the midpoint of the road's longest straight stretch, one on each side in mirror position, on about one board in four (never with the fork or the loop). */
  twin?: Twin;
  /** The slow stretch (core/slowStretch.ts): three consecutive road cells walked at 70% of speed, on about one board in four; a property of road cells, so it composes with every other modifier. */
  slowStretch?: SlowStretch;
  /** True when the path runs top to bottom (portrait boards), false for left to right. */
  vertical: boolean;
}

/**
 * A new random board. The path enters on one short edge and leaves on the opposite one, going
 * forward in runs of 2-3 cells and turning sideways in between, so it never touches itself.
 * Portrait boards (rows > cols) run top to bottom. `rocks` open cells become unbuildable. With
 * `extraBends` of 1 or more the road starts one bend windier (a sideways step at the entrance).
 * With `lengthMul` above 1 the runs are 1–2 cells, so the road turns more often and comes out
 * about 25% longer (the realized length follows the grid). `bgen` 1 boards (old saves, old ghosts)
 * are the board as grown; `bgen` 2 boards always have a choke cell, and with `chokes` 2 they
 * carry two (the road folds back twice, when its tail has room). With `fold` the road gets one
 * switchback fold mid-board: a straight stretch running alongside its own return, a cell of
 * island between (see `core/switchback.ts`). With `farGate` (the wave branch's The door) every
 * board carries the far gate, no roll. With `seed` (the run's own seed) one board in four
 * instead of the fork's roll makes the loop (core/loop.ts): the road circles a rounded ring in
 * the middle of the island once. The decision is the seed's hash and the placement is rng-free,
 * so a board without it is that seed's exact board as grown, and a gen-1 or switchback board
 * never loops. One board in six also carries the cove (core/cove.ts): a bay in the island's edge
 * beside a road curve, the road unchanged; never on a loop or fork board, and rng-free like the
 * loop, so a board without it is that seed's exact board. One board in four also carries the
 * twin (core/twin.ts): the two cells at the midpoint of the road's longest straight stretch,
 * one on each side in mirror position — metadata only, never on a loop or fork board, and
 * rng-free like the loop. One board in four also carries the slow stretch
 * (core/slowStretch.ts): three consecutive road cells walked at 70% of speed — a property of
 * road cells, so it composes with the fork, the loop, the cove and the twin, and rng-free like
 * the loop.
 */
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0, lengthMul = 1, bgen = 2, chokes = 1, fold = false, farGate = false, seed?: number): GameMap {
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

  const map: GameMap = { cols, rows, kinds, path, vertical };
  const folded = fold ? foldSwitchback(map) : map;
  const result = bgen >= 2 ? ensureChokes(folded, chokes) : folded;
  // The far gate (core/farGate.ts): one board in three grows a second entrance. The roll is the seed's last draw, so the road keeps this seed's usual shape; with the wave branch's The door the gate is on every board and the roll is skipped.
  const gate = farGate ? farGateCell(result) : rng.chance(1 / 3) ? farGateCell(result) : undefined;
  // The loop (core/loop.ts): one board in four (the seed's own hash, never the rng) circles a
  // rounded ring in the middle of the island; the placement is rng-free, so a board without it
  // is today's exact board, and it takes the fork's roll while it is placed.
  const looped = seed === undefined || bgen < 2 || fold ? undefined : boardHasLoop(seed) ? placeLoop({ ...result, farGate: gate }) : undefined;
  // The fork (core/fork.ts): one board in three splits the road into two lanes that rejoin before the
  // exit, a full build row between them. The roll is after the far gate's and the placement is
  // rng-free, so a board without it is today's exact board; a switchback board keeps its fold.
  const forked = fold || looped !== undefined ? undefined : rng.chance(1 / 3) ? placeFork({ ...result, farGate: gate }) : undefined;
  // The cove (core/cove.ts): one board in six (the seed's own hash, never the rng) scoops a bay into the
  // island's edge beside a road curve — the road stays, the edge dips in; the placement is rng-free, so a
  // board without it is today's exact board. It never shares a board with the fork's or the loop's silhouette.
  const base = looped ?? forked ?? result;
  const coved = seed === undefined || bgen < 2 || looped !== undefined || forked !== undefined ? undefined : boardHasCove(seed) ? placeCove(base) : undefined;
  // The twin (core/twin.ts): one board in four (the seed's own hash, never the rng) carries the two
  // ordinary build cells at the midpoint of the road's longest straight, one on each side in mirror
  // position — metadata only, the cells stay open, so a board without it is today's exact board;
  // never on a loop or fork board (the cove's own rule).
  const final = coved ?? base;
  const twinned = seed === undefined || bgen < 2 || looped !== undefined || forked !== undefined ? final : boardHasTwin(seed) ? (placeTwin(final) ?? final) : final;
  // The slow stretch (core/slowStretch.ts): one board in four (the seed's own hash, never the rng)
  // walks three consecutive road cells at 70% of speed — a property of road cells, not a shape, so
  // it composes with the fork, the loop, the cove and the twin; the placement is rng-free, so a
  // board without it is today's exact board.
  const stretched = seed === undefined || bgen < 2 ? twinned : boardHasSlowStretch(seed) ? (placeSlowStretch(twinned, seed) ?? twinned) : twinned;
  return { ...stretched, farGate: gate };
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
  for (const p of [...map.path, ...(map.fork?.laneB ?? [])]) {
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
