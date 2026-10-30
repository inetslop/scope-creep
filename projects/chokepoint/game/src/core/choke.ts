import type { Cell, GameMap } from './map';

/**
 * A choke cell is a buildable spot that covers the road twice: within CHOKES_RANGE of the centers
 * of two road cells that are at least CHOKES_APART path steps apart, so a tower there reaches both
 * stretches. Splash's range is the game's shortest, so a tower at a choke covers both stretches
 * even at minimum range. Every `bgen` 2 board is generated with at least one (see `ensureChoke`).
 */
export const CHOKES_RANGE = 1.7; // Splash's range, the game's shortest, in cells
export const CHOKES_APART = 3; // minimum path steps between the two road cells

/** The buildable cells within CHOKES_RANGE of two path cells that are CHOKES_APART steps apart. */
export function chokeCells(map: GameMap): Cell[] {
  const out: Cell[] = [];
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (map.kinds[row]![col] !== 'open') continue;
      let first = -1;
      let last = -1;
      for (let i = 0; i < map.path.length; i++) {
        const p = map.path[i]!;
        if (Math.hypot(p.col - col, p.row - row) <= CHOKES_RANGE) {
          if (first === -1) first = i;
          last = i;
        }
      }
      if (first !== -1 && last - first >= CHOKES_APART) out.push({ col, row });
    }
  }
  return out;
}

/**
 * A board always has a choke cell. When the road already passes near one of its own stretches the
 * board is untouched (byte-identical to the as-grown board, so old saves and ghosts are safe); when
 * it does not, the tail is folded back on the stretch before it. No rng: a given seed gives the
 * same board every time.
 */
export function ensureChoke(map: GameMap): GameMap {
  if (chokeCells(map).length > 0) return map;
  return foldTail(map);
}

/**
 * Folds the road's tail back onto the stretch before it so a choke cell exists. The path is a
 * staircase — along-runs of 2-3 with sideways turns, always ending in an along-run — so walking the
 * tail back finds the last along-run, the corner P before it, the corner C before that, and the far
 * end `a` of the stretch ending at C. The fold only rewrites the tail (after `keep`), so nothing
 * upstream cascades: path[0] and the exit edge are untouched.
 */
function foldTail(map: GameMap): GameMap {
  const { path } = map;
  const A = (c: Cell) => (map.vertical ? c.row : c.col); // along
  const B = (c: Cell) => (map.vertical ? c.col : c.row); // across
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
  const key = (c: Cell) => `${c.col},${c.row}`;
  const length = map.vertical ? map.rows : map.cols;

  // Walk the tail back to its corners.
  let iE = path.length - 1;
  const bE = B(path[path.length - 1]!);
  while (iE > 0 && B(path[iE - 1]!) === bE) iE--; // first cell of the last along-run
  const rB = A(path[iE]!);
  let iP = iE - 1;
  while (iP > 0 && A(path[iP - 1]!) === rB) iP--; // corner P before the last along-run
  const b = B(path[iP]!);
  let iC = iP - 1;
  while (iC > 0 && B(path[iC - 1]!) === b) iC--; // corner C before the stretch that ends at P
  const rA = A(path[iC]!);
  let iH = iC;
  while (iH > 0 && A(path[iH - 1]!) === rA) iH--; // far end of the stretch ending at C
  const a = B(path[iH]!);
  if (rB !== rA + 2 && rB !== rA + 3) return map; // unreachable: the runs are 2-3 cells

  const b2 = b > a ? b - 1 : b + 1; // one step back into the stretch before C: a lane, inside its span
  const up = rB - rA === 3; // the two horizontals are 3 rows apart: pull the last one up a row so they are 2
  const keep = up ? iC + 1 : iP; // last old index that stays
  const tail: Cell[] = up ? [cell(rA + 2, b), cell(rA + 2, b2)] : [cell(rA + 2, b2)];
  for (let r = rA + 3; r < length; r++) tail.push(cell(r, b2));
  const newPath = [...path.slice(0, keep + 1), ...tail]; // last cell is (length-1, b2): still on the exit edge

  const newPathKeys = new Set(newPath.map(key));
  const kinds = map.kinds.map((row) => [...row]);
  for (const c of path) if (!newPathKeys.has(key(c))) kinds[c.row]![c.col] = 'open'; // the old tail becomes buildable

  // The row between the two stretches must stay buildable, so no rock may land on it.
  const protectedKeys = new Set<string>();
  for (let k = Math.min(a, b); k <= Math.max(a, b); k++) protectedKeys.add(key(cell(rA + 1, k)));

  // A rock in the way (a new path cell, or the choke cell itself) is relocated to another open cell.
  const moveList: Cell[] = [];
  const queued = new Set<string>();
  for (const c of newPath) if (kinds[c.row]![c.col] === 'rock' && !queued.has(key(c))) { queued.add(key(c)); moveList.push(c); }
  const choke = cell(rA + 1, b2);
  if (kinds[choke.row]![choke.col] === 'rock' && !queued.has(key(choke))) { queued.add(key(choke)); moveList.push(choke); }
  for (const c of moveList) {
    kinds[c.row]![c.col] = 'open';
    let placed = false;
    for (let row = 0; row < map.rows && !placed; row++) {
      for (let col = 0; col < map.cols && !placed; col++) {
        if (kinds[row]![col] !== 'open') continue;
        const dk = `${col},${row}`;
        if (newPathKeys.has(dk) || protectedKeys.has(dk)) continue;
        kinds[row]![col] = 'rock';
        placed = true;
      }
    }
    // If no home is found the rock is simply dropped (practically unreachable on a real board).
  }

  for (const c of newPath) kinds[c.row]![c.col] = 'path';
  return { ...map, kinds, path: newPath };
}
