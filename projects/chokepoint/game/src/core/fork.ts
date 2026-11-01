import type { Cell, GameMap } from './map';

/**
 * The fork (the board branch's "The fork" trait): the road splits into two equal lanes at the
 * split cell and rejoins before the exit — each enemy takes one, walking the same distance
 * either way, and the full row of build cells between the lanes is the board's double-cover
 * ground, readable from the road's shape. Lane A is the road itself (the path between the two
 * indices); `laneB` is the other lane. The placement is a pure function of the as-grown board
 * (no rng), so the board's seed drives where it sits.
 */

/** The fork: the split and the rejoin as path indices, and the other lane's cells between them (neither end). */
export interface Fork {
  /** The last path cell both lanes share. */
  split: number;
  /** The path cell the lanes rejoin on (lane B's last step arrives there). */
  rejoin: number;
  /** Lane B's cells in walking order: from the split cell to the rejoin cell, neither end. */
  laneB: Cell[];
}

/**
 * Which lane spawn `index` of wave `wave` takes (0: the road itself, 1: lane B): the FNV-1a
 * 31-bit hash of `(seed, wave, index)`, in the daily seeds' pattern. A resumed wave replans its
 * spawns from the post-map rng state, so a sequential draw would shift every later seeded roll
 * and not replay the same lanes — the hash never draws on the run's rng.
 */
export function forkLane(seed: number, wave: number, index: number): 0 | 1 {
  let h = 2166136261;
  const text = `${seed}:${wave}:${index}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) & 1) as 0 | 1;
}

/**
 * Inserts the fork: at the split cell the road's straight stretch goes on for `a1 - a0` more
 * cells, turns two lanes over, and rejoins the road where it was heading — the old middle
 * becomes buildable, and the full row of cells between the lanes (at least 4) stays open, the
 * board's double cover. The candidate is walked deterministically (35% of the way in, outward,
 * direction, then the rejoin along the road) with the relax-and-retry discipline of the bend
 * and choke placements, so a given board forks the same way every time. When no candidate fits
 * (it should not on a real board) undefined comes back and the map stays as grown.
 */
export function placeFork(map: GameMap): GameMap | undefined {
  const { path } = map;
  const n = path.length;
  const A = (c: Cell) => (map.vertical ? c.row : c.col); // along
  const B = (c: Cell) => (map.vertical ? c.col : c.row); // across
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
  const key = (c: Cell) => `${c.col},${c.row}`;
  const length = map.vertical ? map.rows : map.cols;
  const width = map.vertical ? map.cols : map.rows;
  const gate = map.farGate ? path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row) : -1;

  const valid = (newPath: Cell[], laneB: Cell[], split: number): boolean => {
    if (A(newPath[newPath.length - 1]!) !== length - 1) return false; // the exit edge, as before
    const seen = new Set<string>();
    const step = (from: Cell, c: Cell): boolean => {
      if (A(c) < 0 || A(c) >= length || B(c) < 0 || B(c) >= width) return false;
      const k = key(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return Math.abs(c.col - from.col) + Math.abs(c.row - from.row) === 1;
    };
    let prev: Cell = newPath[0]!;
    seen.add(key(prev));
    for (let i = 1; i < newPath.length; i++) {
      if (!step(prev, newPath[i]!)) return false;
      prev = newPath[i]!;
    }
    // Lane B: from the split cell to the rejoin cell through its own cells (the ends are shared, so no
    // duplicate there).
    prev = newPath[split]!;
    for (const c of laneB) {
      if (!step(prev, c)) return false;
      prev = c;
    }
    const end = newPath[split + laneB.length + 1]!; // the rejoin
    return Math.abs(end.col - prev.col) + Math.abs(end.row - prev.row) === 1;
  };

  const target = Math.round(0.35 * n);
  for (const phase of [0, 1] as const) { // 0: the split at ~35% and the rejoin at ~75%, 1: the relaxed windows
    for (let d = 0; ; d++) {
      const cands = d === 0 ? [target] : [target - d, target + d];
      const inWin = cands.map((i) => i >= 2 && i <= n - 6);
      if (!inWin.some(Boolean)) break; // both candidates left the window
      for (let k = 0; k < cands.length; k++) {
        const iP = cands[k];
        if (!inWin[k]) continue;
        const P = path[iP]!;
        const a0 = A(P);
        const b = B(P);
        if (!(A(path[iP - 1]!) === a0 && B(path[iP - 1]!) !== b)) continue; // P starts its run: both fork runs are straight
        for (const dir of [1, -1]) {
          if (B(path[iP - 1]!) === b + dir) continue; // lane B would step back into the entry cell
          const bFar = b + 2 * dir;
          if (bFar < 0 || bFar >= width) continue;
          for (let iR = iP + 1; iR <= n - 2; iR++) {
            const R = path[iR]!;
            if (B(R) !== bFar) continue;
            const a1 = A(R);
            if (a1 - a0 < 5) continue; // the parallel stretch and its buildable row are both a1 - a0 - 1 >= 4
            const span = a1 - a0 + 2; // the walk P -> R on either lane, in cells
            const newN = n - (iR - iP) + span;
            const inSplitWin = phase === 0 ? iP / newN >= 0.3 && iP / newN <= 0.42 : iP / newN >= 0.28 && iP / newN <= 0.45;
            const inRejoinWin = phase === 0 ? (iP + span) / newN >= 0.72 && (iP + span) / newN <= 0.82 : (iP + span) / newN >= 0.7 && (iP + span) / newN <= 0.85;
            if (!inSplitWin || !inRejoinWin) continue;
            if (gate !== -1 && iP < gate + 2) continue; // the far gate's enemies reach the split walking the main road
            const laneA: Cell[] = [];
            for (let a = a0 + 1; a <= a1; a++) laneA.push(cell(a, b)); // on for the stretch
            laneA.push(cell(a1, b + dir), cell(a1, b + 2 * dir)); // over two lanes
            const laneB: Cell[] = [cell(a0, b + dir)]; // out one lane
            for (let a = a0; a <= a1 - 1; a++) laneB.push(cell(a, b + 2 * dir)); // alongside, to the rejoin
            const newPath = [...path.slice(0, iP + 1), ...laneA, ...path.slice(iR + 1)];
            if (!valid(newPath, laneB, iP)) continue;
            // Rebuild the kinds: the old middle becomes buildable, the road and lane B are the road, and a
            // rock in the way (a road cell, a lane B cell, or a cell of the build row between) is
            // relocated, so the whole row stays buildable.
            const newPathKeys = new Set(newPath.map(key));
            const kinds = map.kinds.map((row) => [...row]);
            for (const c of path) if (!newPathKeys.has(key(c))) kinds[c.row]![c.col] = 'open';
            const strip: Cell[] = [];
            for (let a = a0 + 1; a <= a1 - 1; a++) strip.push(cell(a, b + dir));
            const protectedKeys = new Set<string>();
            for (const c of [...newPath, ...laneB, ...strip]) protectedKeys.add(key(c));
            const moveList: Cell[] = [];
            const queued = new Set<string>();
            for (const c of [...newPath, ...laneB, ...strip]) if (kinds[c.row]![c.col] === 'rock' && !queued.has(key(c))) { queued.add(key(c)); moveList.push(c); }
            for (const c of moveList) {
              kinds[c.row]![c.col] = 'open';
              let placed = false;
              for (let row = 0; row < map.rows && !placed; row++) {
                for (let col = 0; col < map.cols && !placed; col++) {
                  if (kinds[row]![col] !== 'open') continue;
                  if (protectedKeys.has(`${col},${row}`)) continue;
                  kinds[row]![col] = 'rock';
                  placed = true;
                }
              }
              // If no home is found the rock is simply dropped (practically unreachable on a real board).
            }
            for (const c of newPath) kinds[c.row]![c.col] = 'path';
            for (const c of laneB) kinds[c.row]![c.col] = 'path';
            return { ...map, kinds, path: newPath, fork: { split: iP, rejoin: iP + span, laneB } };
          }
        }
      }
    }
  }
  return undefined;
}
