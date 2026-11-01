import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { forkLane, placeFork } from '../../src/core/fork';
import { generateMap, kindAt, type Cell, type GameMap } from '../../src/core/map';
import { pathLineFor, pathLineForLane } from '../../src/core/path';
import { Rng } from '../../src/core/rng';

/** The path runs edge to edge, is side-adjacent, uses no cell twice, stays in bounds, and sits on 'path'. */
function expectValidPath(map: GameMap): void {
  const { path, vertical, cols, rows } = map;
  if (vertical) {
    expect(path[0]!.row).toBe(0);
    expect(path[path.length - 1]!.row).toBe(rows - 1);
  } else {
    expect(path[0]!.col).toBe(0);
    expect(path[path.length - 1]!.col).toBe(cols - 1);
  }
  const seen = new Set<string>();
  path.forEach((c, i) => {
    expect(c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('path');
    const key = `${c.col},${c.row}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  });
}

/** The fork's geometry, read back off the board: the two lanes are straight, two lanes apart, and the row between is buildable. */
function expectForkShape(map: GameMap): void {
  const { vertical, cols, rows } = map;
  const A = (c: Cell) => (vertical ? c.row : c.col);
  const B = (c: Cell) => (vertical ? c.col : c.row);
  const cell = (a: number, b: number): Cell => (vertical ? { col: b, row: a } : { col: a, row: b });
  const fork = map.fork!;
  expect(fork.laneB.length).toBe(fork.rejoin - fork.split - 1);
  const P = map.path[fork.split]!;
  const R = map.path[fork.rejoin]!;
  const a0 = A(P), b = B(P), a1 = A(R), bFar = B(R);
  const dir = (bFar - b) / 2;
  expect(dir === 1 || dir === -1).toBe(true); // the lanes are exactly two apart
  expect(a1 - a0 - 1).toBeGreaterThanOrEqual(4); // the stretch is at least 4 cells, and so is its build row
  const bMid = b + dir;
  // Both lanes are inside the board.
  const width = vertical ? cols : rows;
  expect(b >= 0 && b < width && bFar >= 0 && bFar < width).toBe(true);
  // Lane A is the road itself: straight on lane b, then two turns into the rejoin.
  for (let a = a0 + 1; a <= a1; a++) expect(kindAt(map, cell(a, b).col, cell(a, b).row)).toBe('path');
  expect(kindAt(map, cell(a1, bMid).col, cell(a1, bMid).row)).toBe('path');
  expect(map.path[fork.split + (a1 - a0) + 1]!.col).toBe(cell(a1, bMid).col);
  expect(map.path[fork.split + (a1 - a0) + 1]!.row).toBe(cell(a1, bMid).row);
  expect(map.path[fork.rejoin]!.col).toBe(R.col);
  expect(map.path[fork.rejoin]!.row).toBe(R.row);
  // Lane B is straight on the far lane, from the split cell to the rejoin.
  expect(kindAt(map, cell(a0, bMid).col, cell(a0, bMid).row)).toBe('path');
  for (let a = a0; a <= a1 - 1; a++) expect(kindAt(map, cell(a, bFar).col, cell(a, bFar).row)).toBe('path');
  expect(fork.laneB).toHaveLength(a1 - a0 + 1);
  fork.laneB.forEach((c) => expect(kindAt(map, c.col, c.row)).toBe('path'));
  // The full row between the lanes is the board's double cover: every one of it is buildable.
  for (let a = a0 + 1; a <= a1 - 1; a++) expect(kindAt(map, cell(a, bMid).col, cell(a, bMid).row)).toBe('open');
}

describe('the fork', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 400 seeds fork a minority of boards, the rest stay as grown`, () => {
      let withFork = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5);
        expectValidPath(map);
        // Deterministic: a fresh identical call gives the same board.
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5));
        const fork = map.fork;
        if (!fork) continue;
        withFork++;
        expectForkShape(map);
        // The split at ~35%, the rejoin at ~75-80% (the relaxed windows of the placement).
        const n = map.path.length;
        expect(fork.split / n).toBeGreaterThanOrEqual(0.28);
        expect(fork.split / n).toBeLessThanOrEqual(0.45);
        expect(fork.rejoin / n).toBeGreaterThanOrEqual(0.7);
        expect(fork.rejoin / n).toBeLessThanOrEqual(0.85);
        // The far gate, when the board carries both, sits before the split: its enemies reach it walking the main road.
        if (map.farGate) {
          const gate = map.path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row);
          expect(gate).toBeGreaterThanOrEqual(2);
          expect(gate).toBeLessThanOrEqual(fork.split - 2);
        }
      }
      // A minority of boards fork (the roll is ~1 in 3, and the placement keeps it only when a
      // straight stretch with a matching rejoin still survives): enough that the checks above run,
      // far from all of them.
      expect(withFork).toBeGreaterThanOrEqual(15);
      expect(withFork).toBeLessThan(200);
      expect(withFork < 400).toBe(true); // some boards stay single-lane
    });
  }

  it('a switchback fold never forks: its stretch stays its own', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 100; seed++) {
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, true).fork).toBeUndefined();
      }
    }
  });

  it('forkLane is the (seed, wave, index) hash: deterministic, ~50/50, and differs by seed', () => {
    for (let i = 0; i < 200; i++) expect(forkLane(1234, 7, i)).toBe(forkLane(1234, 7, i));
    let laneB = 0;
    for (let i = 0; i < 200; i++) laneB += forkLane(1234, 7, i);
    expect(laneB).toBeGreaterThanOrEqual(80);
    expect(laneB).toBeLessThanOrEqual(120);
    let differs = 0;
    for (let i = 0; i < 200; i++) if (forkLane(1234, 7, i) !== forkLane(1235, 7, i)) differs++;
    expect(differs).toBeGreaterThan(0);
  });

  it('the lanes are equal length, and the routes agree before the split and after the rejoin', () => {
    let checked = 0;
    for (let seed = 1; seed <= 400 && checked < 20; seed++) {
      for (const [cols, rows] of [
        [14, 8],
        [8, 14],
      ] as const) {
        const map = generateMap(new Rng(seed), cols, rows, 5);
        if (!map.fork) continue;
        checked++;
        const line0 = pathLineFor(map, CELL);
        const line1 = pathLineForLane(map, CELL, 1);
        expect(line1.length).toBe(line0.length); // the same walk either lane
        const { split, rejoin } = map.fork;
        // Point for point: the same cells before the split and from the rejoin on (the before/after points are one cell outside the board).
        expect(line1.points.slice(0, split + 2)).toEqual(line0.points.slice(0, split + 2));
        expect(line1.points.slice(rejoin + 1)).toEqual(line0.points.slice(rejoin + 1));
        // Without a fork, lane 1 is the road itself.
        const plain = generateMap(new Rng(seed), cols, rows, 5);
        if (!plain.fork) expect(pathLineForLane(plain, CELL, 1).points).toEqual(pathLineFor(plain, CELL).points);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(1);
  });

  it('placeFork is deterministic: the same grown board forks the same way every time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grown = generateMap(new Rng(seed), 14, 8, 5);
      expect(placeFork(grown)).toEqual(placeFork(grown));
    }
  });
});
