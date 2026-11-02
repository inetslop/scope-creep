import { describe, expect, it } from 'vitest';
import { chokeCells } from '../../src/core/choke';
import { generateMap, kindAt, type Cell, type GameMap } from '../../src/core/map';
import { boardHasLoop, placeLoop } from '../../src/core/loop';
import { Rng } from '../../src/core/rng';

const key = (c: Cell) => `${c.col},${c.row}`;
const cheb = (a: Cell, b: Cell) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));

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
    const k = `${c.col},${c.row}`;
    expect(seen.has(k)).toBe(false);
    seen.add(k);
    if (i > 0) expect(Math.abs(c.col - path[i - 1]!.col) + Math.abs(c.row - path[i - 1]!.row)).toBe(1);
  });
}

/** The open cells the island's edge can't reach: the loop's inside, and any pocket the rocks close in. */
function sealedOpenCells(map: GameMap): Cell[] {
  const open = (col: number, row: number) => kindAt(map, col, row) === 'open';
  const seen = new Set<string>();
  const queue: Cell[] = [];
  const seedCell = (col: number, row: number) => {
    if (open(col, row) && !seen.has(key({ col, row }))) {
      seen.add(key({ col, row }));
      queue.push({ col, row });
    }
  };
  for (let col = 0; col < map.cols; col++) {
    seedCell(col, 0);
    seedCell(col, map.rows - 1);
  }
  for (let row = 0; row < map.rows; row++) {
    seedCell(0, row);
    seedCell(map.cols - 1, row);
  }
  while (queue.length) {
    const c = queue.pop()!;
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const col = c.col + dc;
      const row = c.row + dr;
      if (open(col, row) && !seen.has(key({ col, row }))) {
        seen.add(key({ col, row }));
        queue.push({ col, row });
      }
    }
  }
  const out: Cell[] = [];
  for (let row = 0; row < map.rows; row++)
    for (let col = 0; col < map.cols; col++) if (open(col, row) && !seen.has(key({ col, row }))) out.push({ col, row });
  return out;
}

/** The loop's geometry, read back off the board; returns the ring's entry index in the road. */
function expectLoopShape(map: GameMap): number {
  const ring = map.loop!.ring;
  expect(ring.length).toBeGreaterThanOrEqual(12);
  expect(ring.length).toBeLessThanOrEqual(16);
  // A closed, side-adjacent cycle that walks each ring cell once, all on the road.
  const seen = new Set<string>();
  for (let i = 0; i < ring.length; i++) {
    const c = ring[i]!;
    expect(seen.has(key(c))).toBe(false);
    seen.add(key(c));
    expect(kindAt(map, c.col, c.row)).toBe('path');
    const prev = ring[(i - 1 + ring.length) % ring.length]!;
    expect(Math.abs(c.col - prev.col) + Math.abs(c.row - prev.row)).toBe(1);
  }
  // Never a perfect rectangle: the ring is not the boundary of its own box (a corner is pushed out).
  const loC = Math.min(...ring.map((c) => c.col));
  const hiC = Math.max(...ring.map((c) => c.col));
  const loR = Math.min(...ring.map((c) => c.row));
  const hiR = Math.max(...ring.map((c) => c.row));
  const perim = new Set<string>();
  for (let c = loC; c <= hiC; c++) {
    perim.add(`${c},${loR}`);
    perim.add(`${c},${hiR}`);
  }
  for (let r = loR; r <= hiR; r++) {
    perim.add(`${loC},${r}`);
    perim.add(`${hiC},${r}`);
  }
  expect(perim.size === seen.size && [...perim].every((k) => seen.has(k))).toBe(false);
  // The inside: 4-6 open cells sealed by the ring (flood fill from the island's edge, kept to the
  // ring's box: the prefix and the exit run can close their own pocket beside the mouth).
  const inside = sealedOpenCells(map).filter((c) => c.col > loC && c.col < hiC && c.row > loR && c.row < hiR);
  expect(inside.length).toBeGreaterThanOrEqual(4);
  expect(inside.length).toBeLessThanOrEqual(6);
  // The ring is a contiguous, in-order slice of the road.
  const i0 = map.path.findIndex((c) => c.col === ring[0]!.col && c.row === ring[0]!.row);
  expect(i0).toBeGreaterThanOrEqual(1);
  ring.forEach((c, i) => {
    expect(map.path[i0 + i]!.col).toBe(c.col);
    expect(map.path[i0 + i]!.row).toBe(c.row);
  });
  // A cell of clearance to the rest of the road, except at the mouth's two connectors.
  for (let i = 0; i < map.path.length; i++) {
    if (i >= i0 && i < i0 + ring.length) continue; // the ring itself
    if (i === i0 - 1 || i === i0 + ring.length) continue; // the mouth: the entry's and the exit's connector
    for (const r of ring) expect(cheb(map.path[i]!, r)).toBeGreaterThanOrEqual(2);
  }
  // No cell covers the whole loop at range 2, and the best cover is the inside's.
  const covered = (c: Cell) => ring.filter((r) => Math.hypot(r.col - c.col, r.row - c.row) <= 2).length;
  let best = 0;
  let insideBest = 0;
  for (let row = 0; row < map.rows; row++)
    for (let col = 0; col < map.cols; col++) {
      if (kindAt(map, col, row) !== 'open') continue;
      const n = covered({ col, row });
      best = Math.max(best, n);
    }
  for (const s of inside) insideBest = Math.max(insideBest, covered(s));
  expect(best).toBeLessThan(ring.length); // the mouth is always left out of any one cell's reach
  expect(insideBest).toBe(best); // and the best cover is a cell inside the ring
  return i0;
}

describe('the loop', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: 500 seeds loop about one board in four, the rest stay as grown`, () => {
      let looped = 0;
      for (let seed = 1; seed <= 500; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        expectValidPath(map);
        // Deterministic: a fresh identical call gives the same board.
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed));
        if (!map.loop) {
          // A board without the loop is today's exact board, the cove's bay aside: when it does not
          // cove, it is the same grown board, no seed.
          if (!map.cove) expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5));
          continue;
        }
        looped++;
        expect(map.fork).toBeUndefined(); // the loop takes the fork's roll: the two never share a board
        const i0 = expectLoopShape(map);
        expect(chokeCells(map).length).toBeGreaterThanOrEqual(1); // the loop swallows no choke cell
        // The far gate, when the board carries it, stays on the kept prefix: a straight cell before the ring's entry.
        if (map.farGate) {
          const gate = map.path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row);
          expect(gate).toBeGreaterThanOrEqual(2);
          expect(gate).toBeLessThan(i0);
          const a = map.path[gate - 1]!;
          const b = map.path[gate]!;
          const c = map.path[gate + 1]!;
          expect(b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row).toBe(true);
        }
      }
      // About one board in four loops (the seed's own hash), and the placement keeps it on a
      // majority of those: enough that the checks above run, far from all of them.
      expect(looped).toBeGreaterThanOrEqual(90);
      expect(looped).toBeLessThanOrEqual(160);
    });
  }

  it('boardHasLoop is the seed hash: deterministic, one in four', () => {
    let looped = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      expect(boardHasLoop(seed)).toBe(boardHasLoop(seed));
      looped += boardHasLoop(seed) ? 1 : 0;
    }
    expect(looped).toBeGreaterThanOrEqual(180);
    expect(looped).toBeLessThanOrEqual(320);
  });

  it('placeLoop is deterministic: the same grown board loops the same way every time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grown = generateMap(new Rng(seed), 14, 8, 5);
      expect(placeLoop(grown)).toEqual(placeLoop(grown));
    }
  });

  it('a switchback fold and a gen-1 board never loop', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 100; seed++) {
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, true, false, seed).loop).toBeUndefined();
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 1, 1, false, false, seed).loop).toBeUndefined();
      }
    }
  });

  it('windy boards (the bend, the long road, two chokes, the door) still loop validly', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      let looped = 0;
      for (let seed = 1; seed <= 100; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 1, 1.25, 2, 2, false, true, seed);
        expectValidPath(map);
        if (!map.loop) continue;
        looped++;
        expect(map.fork).toBeUndefined();
        const i0 = expectLoopShape(map);
        // The far gate, when it could be placed (a bendy board has no straight cell for it), stays on the kept prefix:
        // a straight cell before the ring's entry.
        if (map.farGate) {
          const gate = map.path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row);
          expect(gate).toBeGreaterThanOrEqual(2);
          expect(gate).toBeLessThan(i0);
          const a = map.path[gate - 1]!;
          const b = map.path[gate]!;
          const c = map.path[gate + 1]!;
          expect(b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row).toBe(true);
        }
      }
      expect(looped).toBeGreaterThanOrEqual(1);
    }
  });
});
