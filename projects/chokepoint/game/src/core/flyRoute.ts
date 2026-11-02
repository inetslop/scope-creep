import type { GameMap } from './map';
import { cellCenter, PathLine, type Point } from './path';
import { Rng } from './rng';

/** One Flyer's crossing: where it lifts off on the entrance edge, where it lands, and its whole path in between. */
export interface FlyLine {
  spawn: Point; // on the entrance edge, board units
  exit: Point;  // the road's own end: one cell past the exit, as pathLineFor
  line: PathLine; // the two-point flight
}

/** The road's own end in board units: the center of the cell one past the exit (the same rule pathLineFor walks to). */
export function exitPoint(map: GameMap, cellSize: number): Point {
  const last = map.path[map.path.length - 1]!;
  const after = map.vertical ? { col: last.col, row: last.row + 1 } : { col: last.col + 1, row: last.row };
  return cellCenter(after, cellSize);
}

/**
 * What fraction of a straight line from `a` to `b` runs over 'open' build cells: quarter-cell
 * samples along it, 0-1. A crossing that follows the road is not a crossing, so the spawn point
 * is redrawn while this stays under the line's threshold (pickFlyLine).
 */
export function openFraction(map: GameMap, cellSize: number, a: Point, b: Point): number {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(len / (cellSize / 4)));
  let open = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (map.kinds[Math.floor(y / cellSize)]?.[Math.floor(x / cellSize)] === 'open') open++;
  }
  return open / (n + 1);
}

/**
 * The seed's crossing for one Flyer: a point on the entrance edge, and the straight line from
 * it to the exit. The point is redrawn from `rng` while the line would follow the road
 * (openFraction under 0.2), at most 24 times, then accepted. Pure: the same seed and board
 * draw the same crossing.
 */
export function pickFlyLine(map: GameMap, rng: Rng, cellSize: number): FlyLine {
  const exit = exitPoint(map, cellSize);
  const edge = (): Point =>
    map.vertical
      ? { x: rng.range(0.5, map.cols - 0.5) * cellSize, y: 0 }
      : { x: 0, y: rng.range(0.5, map.rows - 0.5) * cellSize };
  let spawn = edge();
  for (let tries = 0; tries < 24 && openFraction(map, cellSize, spawn, exit) < 0.2; tries++) spawn = edge();
  return { spawn, exit, line: new PathLine([spawn, exit]) };
}

/** The boss Flyer's crossing: its seeded spawn point off the island's entrance edge, its seeded bank point on the island's edge, and the exit gate. */
export interface FlyRoute {
  spawn: Point; // half a cell off the island, on the entrance edge
  bank: Point;  // on the island's edge, where the bank turns the route
  exit: Point;  // the exit gate: the last path cell's center
}

/**
 * The board's crossing for the boss Flyer: one straight line from a point off the island's
 * entrance edge to the exit gate, and the edge bank point the bank turns to at half health.
 * Seeded from the board itself (the same board always gives the same crossing), so the route
 * never draws on the run's rng; the spawn row and the bank column are the seed's two draws.
 * The line never leaves through the entrance gate: the spawn is off the entrance's own row (col).
 */
export function flyRouteFor(map: GameMap, cellSize: number): FlyRoute {
  let seed = (map.cols * 73856093) ^ (map.rows * 19349663);
  for (let i = 0; i < map.path.length; i++) {
    const c = map.path[i]!;
    seed = (seed + Math.imul(i + 1, c.col * 928371 + c.row * 689287 + 13)) >>> 0;
  }
  const rng = new Rng(seed);
  const last = map.path[map.path.length - 1]!;
  const exit = cellCenter(last, cellSize);
  const entrance = map.path[0]!;
  let spawn: Point;
  let bank: Point;
  if (map.vertical) {
    // Portrait: it lifts off the top edge and lands the bank on the left or right edge.
    let col = rng.int(0, map.cols - 1);
    while (col === entrance.col) col = rng.int(0, map.cols - 1);
    spawn = { x: (col + 0.5) * cellSize, y: -0.5 * cellSize };
    const row = rng.int(1, map.rows - 2);
    bank = { x: spawn.x < (map.cols * cellSize) / 2 ? map.cols * cellSize : 0, y: (row + 0.5) * cellSize };
  } else {
    // Landscape: it lifts off the left edge and lands the bank on the top or bottom edge.
    let row = rng.int(0, map.rows - 1);
    while (row === entrance.row) row = rng.int(0, map.rows - 1);
    spawn = { x: -0.5 * cellSize, y: (row + 0.5) * cellSize };
    const col = rng.int(1, map.cols - 2);
    bank = { x: (col + 0.5) * cellSize, y: spawn.y < (map.rows * cellSize) / 2 ? map.rows * cellSize : 0 };
  }
  return { spawn, bank, exit };
}

/** The boss Flyer's first line: the straight crossing from its spawn point to the exit gate. */
export function firstLine(route: FlyRoute): PathLine {
  return new PathLine([route.spawn, route.exit]);
}

/** The boss Flyer's route after its bank: from where it is now, to the edge bank point, on to the exit gate. */
export function bankedLine(route: FlyRoute, from: Point): PathLine {
  return new PathLine([from, route.bank, route.exit]);
}
