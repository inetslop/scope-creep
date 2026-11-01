import { kindAt, type Cell, type GameMap } from './map';

/**
 * The switchback (the board branch's "The switchback" node): one fold in the middle of the road —
 * a straight stretch of 3-5 cells running alongside its own return, one cell of island between, so
 * a tower in the strip covers both stretches. A detour, not a fork: the one road still walks from
 * the entrance to the exit. The fold is a pure function of the as-grown board (no rng), so the
 * board's seed drives where it sits.
 */

/** The fold: the two parallel runs in walking order, the width of the island strip between them, and where the earlier run starts. */
export interface SwitchbackFold {
  a: Cell[];
  b: Cell[];
  gap: number;
  start: number;
}

/**
 * Inserts the fold: the road leaves its current stretch, runs on for L more cells, turns two
 * lanes over, comes straight back alongside, and leaves again one lane further out for the exit.
 * The candidate is walked deterministically (middle third before anywhere, stretch length first
 * down to 3, then direction, then position) with the relax-and-retry discipline of the bend and
 * choke placements, so a given board folds the same way every time. When no candidate fits (it
 * should not on a real board) the map is returned unchanged.
 */
export function foldSwitchback(map: GameMap): GameMap {
  const { path } = map;
  const A = (c: Cell) => (map.vertical ? c.row : c.col); // along
  const B = (c: Cell) => (map.vertical ? c.col : c.row); // across
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
  const key = (c: Cell) => `${c.col},${c.row}`;
  const length = map.vertical ? map.rows : map.cols;
  const width = map.vertical ? map.cols : map.rows;

  const valid = (newPath: Cell[]): boolean => {
    if (A(newPath[newPath.length - 1]!) !== length - 1) return false; // the exit edge, as before
    const seen = new Set<string>();
    for (let i = 0; i < newPath.length; i++) {
      const c = newPath[i]!;
      const a = A(c);
      const b = B(c);
      if (a < 0 || a >= length || b < 0 || b >= width) return false;
      const k = key(c);
      if (seen.has(k)) return false;
      seen.add(k);
      if (i > 0) {
        const p = newPath[i - 1]!;
        if (Math.abs(c.col - p.col) + Math.abs(c.row - p.row) !== 1) return false;
      }
    }
    return true;
  };

  for (const phase of [0, 1] as const) { // 0: the fold starts in the middle third of the road, 1: anywhere
    for (const L of [5, 4, 3]) { // the forward stretch, with P
    for (const d of [1, -1]) {
      const from = phase === 0 ? Math.floor(path.length / 3) : 0;
      const to = phase === 0 ? Math.ceil((2 * path.length) / 3) : path.length - 1;
      for (let iP = from; iP <= to; iP++) {
        const P = path[iP]!;
        const a0 = A(P);
        const b = B(P);
        const bFar = b + 3 * d; // the suffix's lane
        if (bFar < 0 || bFar >= width) continue;
        if (a0 + L - 1 > length - 1) continue;
        if (iP > 0 && B(path[iP - 1]!) === b) continue; // P must start its run: both fold runs are exactly L long
        const newPath: Cell[] = path.slice(0, iP + 1);
        for (let a = a0 + 1; a <= a0 + L - 1; a++) newPath.push(cell(a, b)); // on for the stretch
        newPath.push(cell(a0 + L - 1, b + d), cell(a0 + L - 1, b + 2 * d)); // over two lanes
        for (let a = a0 + L - 2; a >= a0; a--) newPath.push(cell(a, b + 2 * d)); // back alongside
        newPath.push(cell(a0, b + 3 * d)); // out again, one lane further
        for (let a = a0 + 1; a <= length - 1; a++) newPath.push(cell(a, b + 3 * d)); // to the exit
        if (!valid(newPath)) continue;
        if (phase === 0 && !(iP * 3 >= newPath.length && iP * 3 <= newPath.length * 2)) continue; // still in the middle third
        // Rebuild the kinds: the old tail becomes buildable, the new path is the road, and a rock in
        // the way (a new path cell, or a cell of the island between the two runs) is relocated, so
        // the whole strip stays buildable.
        const newPathKeys = new Set(newPath.map(key));
        const kinds = map.kinds.map((row) => [...row]);
        for (const c of path) if (!newPathKeys.has(key(c))) kinds[c.row]![c.col] = 'open';
        const strip: Cell[] = [];
        for (let a = a0; a <= a0 + L - 2; a++) strip.push(cell(a, b + d));
        const protectedKeys = new Set(strip.map(key));
        const moveList: Cell[] = [];
        const queued = new Set<string>();
        for (const c of newPath) if (kinds[c.row]![c.col] === 'rock' && !queued.has(key(c))) { queued.add(key(c)); moveList.push(c); }
        for (const c of strip) if (kinds[c.row]![c.col] === 'rock' && !queued.has(key(c))) { queued.add(key(c)); moveList.push(c); }
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
    }
    }
  }
  return map;
}

/**
 * The fold, when the board has one: the first pair of straight runs along the entrance-to-exit
 * axis that run parallel two or three lanes apart (a rock-free island strip between), each 3-5
 * cells long, overlapping in their along range, with the earlier run starting in the middle third
 * of the road. For the tests; null otherwise.
 */
export function switchbackFold(map: GameMap): SwitchbackFold | null {
  const { path } = map;
  const A = (c: Cell) => (map.vertical ? c.row : c.col);
  const B = (c: Cell) => (map.vertical ? c.col : c.row);
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });

  // The path's maximal straight runs: the cells between two changes of step direction.
  interface Run { start: number; end: number; }
  const runs: Run[] = [];
  let start = 0;
  for (let i = 2; i < path.length; i++) {
    if (A(path[i]!) - A(path[i - 1]!) !== A(path[i - 1]!) - A(path[i - 2]!) || B(path[i]!) - B(path[i - 1]!) !== B(path[i - 1]!) - B(path[i - 2]!)) {
      runs.push({ start, end: i - 1 });
      start = i - 1;
    }
  }
  runs.push({ start, end: path.length - 1 });

  interface AlongRun { start: number; lane: number; from: number; to: number; len: number; }
  const alongRuns: AlongRun[] = [];
  for (const r of runs) {
    if (r.end === r.start) continue; // a single cell has no direction
    const lane = B(path[r.start]!);
    if (lane !== B(path[r.end]!)) continue; // a sideways run, not along the entrance-to-exit axis
    const a0 = A(path[r.start]!);
    const a1 = A(path[r.end]!);
    alongRuns.push({ start: r.start, lane, from: Math.min(a0, a1), to: Math.max(a0, a1), len: r.end - r.start + 1 });
  }

  for (let i = 0; i < alongRuns.length; i++) {
    const x = alongRuns[i]!;
    if (x.len < 3 || x.len > 5) continue;
    for (let j = i + 1; j < alongRuns.length; j++) {
      const y = alongRuns[j]!;
      if (y.len < 3 || y.len > 5) continue;
      const offset = Math.abs(x.lane - y.lane);
      if (offset < 2 || offset > 3) continue;
      const s = Math.max(x.from, y.from);
      const e = Math.min(x.to, y.to);
      if (e - s + 1 < 3) continue; // the two stretches run alongside for real
      let stripClear = true;
      for (let a = s; a <= e && stripClear; a++) {
        for (let m = Math.min(x.lane, y.lane) + 1; m < Math.max(x.lane, y.lane); m++) {
          if (kindAt(map, cell(a, m).col, cell(a, m).row) === 'rock') { stripClear = false; break; }
        }
      }
      if (!stripClear) continue;
      if (x.start * 3 < path.length || x.start * 3 > path.length * 2) continue; // the earlier run starts in the middle third
      return {
        a: path.slice(x.start, x.start + x.len),
        b: path.slice(y.start, y.start + y.len),
        gap: offset - 1,
        start: x.start,
      };
    }
  }
  return null;
}
