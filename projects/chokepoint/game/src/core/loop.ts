import { chokeCells } from './choke';
import type { Cell, GameMap } from './map';

/**
 * The loop (the board's "The loop" trait): on one board in four the road makes one closed loop
 * in the middle of the island — it enters a rounded ring of 14-16 road cells, walks it once
 * through, and leaves from the cell beside the entry at the mouth, so the ring's inside (4-6
 * build cells) covers more road than any cell outside the loop. The decision is the seed's own
 * FNV-1a hash (like the fork's lanes) and the placement is a pure function of the grown board
 * (no rng), so a board without a loop is today's exact board, down to the bytes.
 */

/** The loop: the ring's cells in walking order — the road enters at ring[0] and leaves at ring[ring.length - 1], which are adjacent (the mouth). */
export interface Loop {
  ring: Cell[];
}

/**
 * Whether the board with this seed has a loop: the FNV-1a 31-bit hash of `loop:${seed}`, in the
 * daily seeds' pattern — one in four. It never draws on the run's rng, so a board without a loop
 * rolls the fork and its waves exactly as today.
 */
export function boardHasLoop(seed: number): boolean {
  let h = 2166136261;
  const text = `loop:${seed}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 4 === 0;
}

/**
 * Inserts the loop: at the mouth's connector cell the road leaves the old road for a rounded
 * ring — a box of `a` by `b` with its top-right corner pushed two cells out, 2a+2b-2 cells long
 * (14-16) — walks it once, and leaves again from the cell beside the entry for the exit, the
 * ring's inside (4-6 cells) staying open, the board's best cover. The candidate is walked
 * deterministically (ring shape, position from the middle out, the mouth from the middle of the
 * left side out) with the relax-and-retry discipline of the bend and choke placements, so a
 * given board loops the same way every time. When no candidate fits (it should not on a real
 * board) undefined comes back and the board stays as grown. The input has the far gate set
 * (when it has one) and no fork.
 */
export function placeLoop(map: GameMap): GameMap | undefined {
  const { path } = map;
  const A = (c: Cell) => (map.vertical ? c.row : c.col); // along
  const B = (c: Cell) => (map.vertical ? c.col : c.row); // across
  const cell = (a: number, b: number): Cell => (map.vertical ? { col: b, row: a } : { col: a, row: b });
  const key = (c: Cell) => `${c.col},${c.row}`;
  const length = map.vertical ? map.rows : map.cols;
  const width = map.vertical ? map.cols : map.rows;
  const gate = map.farGate ? path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row) : -1;
  const chokesBefore = chokeCells(map).length;

  const valid = (newPath: Cell[], ring: Cell[], iP: number): boolean => {
    if (A(newPath[newPath.length - 1]!) !== length - 1) return false; // the exit edge, as before
    // The kept prefix runs nowhere near the ring, except at the mouth's connector itself — a
    // sideways turn in the old road that runs alongside the ring fails it and the mouth moves on.
    for (let i = 0; i < iP; i++) {
      const c = path[i]!;
      for (const r of ring) if (Math.max(Math.abs(c.col - r.col), Math.abs(c.row - r.row)) < 2) return false;
    }
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
    return true;
  };

  const shapes: [number, number][] = [[4, 4], [5, 4], [4, 5]];
  for (const [a, b] of shapes) {
    const raC = Math.floor((length - a) / 2);
    const rbC = Math.floor((width - b) / 2);
    for (let d = 0; d <= 2; d++) {
      const raCands = d === 0 ? [raC] : [raC - d, raC + d];
      const rbCands = d === 0 ? [rbC] : [rbC - d, rbC + d];
      for (const ra of raCands) {
        if (ra < 2 || ra + a > length - 2) continue; // the mouth's connector and the ring's bulge stay one cell in
        for (const rb of rbCands) {
          if (rb < 1 || rb + b - 1 > width - 2 || rb + b + 1 > width - 1) continue; // the ring and the exit stretch stay one cell in
          const ebC = rb + Math.floor((b - 1) / 2); // the mouth at the middle of the left side
          for (let de = 0; de <= 2; de++) {
            const ebCands = de === 0 ? [ebC] : [ebC - de, ebC + de];
            for (const eb of ebCands) {
              if (eb < rb || eb > rb + b - 2) continue; // the mouth's two cells sit on the left side
              const P = cell(ra - 1, eb);
              const iP = path.findIndex((c) => c.col === P.col && c.row === P.row);
              if (iP < 2) continue; // the connector is a path cell, not the entrance
              if (gate !== -1 && gate >= iP) continue; // the far gate stays on the kept prefix, before the mouth
              const ring: Cell[] = [cell(ra, eb)]; // the entry
              for (let y = eb - 1; y >= rb; y--) ring.push(cell(ra, y)); // up the left side to the top
              for (let x = ra + 1; x <= ra + a - 1; x++) ring.push(cell(x, rb)); // the top side
              ring.push(cell(ra + a, rb), cell(ra + a, rb + 1)); // the top-right corner, bulged two out
              for (let y = rb + 1; y <= rb + b - 1; y++) ring.push(cell(ra + a - 1, y)); // down the right side
              for (let x = ra + a - 2; x >= ra; x--) ring.push(cell(x, rb + b - 1)); // the bottom side
              for (let y = rb + b - 2; y >= eb + 1; y--) ring.push(cell(ra, y)); // up the left side to the exit
              const exit: Cell[] = [cell(ra - 1, eb + 1), cell(ra - 2, eb + 1)];
              for (let y = eb + 2; y <= rb + b + 1; y++) exit.push(cell(ra - 2, y));
              for (let x = ra - 1; x <= length - 1; x++) exit.push(cell(x, rb + b + 1)); // to the exit edge
              const newPath = [...path.slice(0, iP + 1), ...ring, ...exit];
              if (!valid(newPath, ring, iP)) continue;
              // Rebuild the kinds: the old tail becomes buildable, the ring and the exit stretch are
              // the road, and a rock in the way (a ring cell or an inside cell) is relocated, so the
              // loop's inside stays buildable.
              const newPathKeys = new Set(newPath.map(key));
              const kinds = map.kinds.map((row) => [...row]);
              for (const c of path) if (!newPathKeys.has(key(c))) kinds[c.row]![c.col] = 'open';
              const interior: Cell[] = [];
              for (let x = ra + 1; x <= ra + a - 2; x++) for (let y = rb + 1; y <= rb + b - 2; y++) interior.push(cell(x, y));
              const protectedKeys = new Set<string>();
              for (const c of [...newPath, ...interior]) protectedKeys.add(key(c));
              const moveList: Cell[] = [];
              const queued = new Set<string>();
              for (const c of [...newPath, ...interior]) if (kinds[c.row]![c.col] === 'rock' && !queued.has(key(c))) { queued.add(key(c)); moveList.push(c); }
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
              const next: GameMap = { ...map, kinds, path: newPath, loop: { ring } };
              if (chokeCells(next).length < chokesBefore) continue; // the loop swallows no choke cell
              return next;
            }
          }
        }
      }
    }
  }
  return undefined;
}
