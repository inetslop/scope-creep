import { describe, expect, it } from 'vitest';
import { boardHasCove, placeCove, stretchesReached, type Cove } from '../../src/core/cove';
import { generateMap, kindAt, type Cell, type GameMap } from '../../src/core/map';
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

/** The cove's geometry, read back off the board: three build cells in one edge lane at the road's corner, double-cover. */
function expectCoveShape(map: GameMap): void {
  const { vertical, cols, rows } = map;
  const A = (c: Cell) => (vertical ? c.row : c.col);
  const B = (c: Cell) => (vertical ? c.col : c.row);
  const cell = (a: number, b: number): Cell => (vertical ? { col: b, row: a } : { col: a, row: b });
  const width = vertical ? cols : rows;
  const length = vertical ? rows : cols;
  const cove: Cove = map.cove!;
  // The pocket: three cells, all buildable, all in one edge lane, consecutive along the edge.
  expect(cove.cells).toHaveLength(3);
  for (const c of cove.cells) expect(kindAt(map, c.col, c.row)).toBe('open');
  const edge = B(cove.cells[0]!);
  expect(edge === 0 || edge === width - 1).toBe(true);
  for (const c of cove.cells) expect(B(c)).toBe(edge);
  const a0 = A(cove.cells[0]!);
  expect(A(cove.cells[1]!)).toBe(a0 + 1);
  expect(A(cove.cells[2]!)).toBe(a0 + 2);
  expect(a0 >= 0 && a0 + 2 <= length - 1).toBe(true);
  // The corner: the road's cell in the lane beside the pocket's middle cell, and the road turns there.
  const mid = cell(A(cove.cells[1]!), edge === 0 ? 1 : width - 2);
  expect(kindAt(map, mid.col, mid.row)).toBe('path');
  const i = map.path.findIndex((c) => c.col === mid.col && c.row === mid.row);
  expect(i).toBeGreaterThanOrEqual(1);
  expect(i).toBeLessThan(map.path.length - 1);
  const a = map.path[i - 1]!, b = map.path[i]!, c = map.path[i + 1]!;
  expect(b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row).toBe(false); // the direction changes at the corner
  // The double-cover guarantee: at least two pocket cells reach two or more straight stretches of the road.
  expect(cove.cells.filter((c) => stretchesReached(map, c) >= 2).length).toBeGreaterThanOrEqual(2);
}

describe('the cove', () => {
  it('on 14x8 and 8x14: 1000 seeds cove between one in ten and one in four, never with the fork or the loop', () => {
    let coved = 0;
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 1000; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        expectValidPath(map);
        // Deterministic: a fresh identical call gives the same board (the board code's round-trip rule).
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed));
        if (!map.cove) {
          // A board without the cove is today's exact board: when it does not loop (the loop would
          // change the fork's roll), twin or stretch, it is the same board the seed grows without a seed.
          if (!map.loop && !map.twin && !map.slowStretch) expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5));
          continue;
        }
        coved++;
        expect(map.fork).toBeUndefined(); // the cove never shares a board with the fork's or the loop's silhouette
        expect(map.loop).toBeUndefined();
        expectCoveShape(map);
      }
    }
    // Between one in ten and one in four of the boards cove (the target is one in six).
    expect(coved / 2000).toBeGreaterThanOrEqual(0.1);
    expect(coved / 2000).toBeLessThanOrEqual(0.25);
  });

  it('boardHasCove is the seed hash: deterministic, one in six', () => {
    let coved = 0;
    for (let seed = 1; seed <= 6000; seed++) {
      expect(boardHasCove(seed)).toBe(boardHasCove(seed));
      coved += boardHasCove(seed) ? 1 : 0;
    }
    expect(coved).toBeGreaterThanOrEqual(850);
    expect(coved).toBeLessThanOrEqual(1250);
  });

  it('placeCove is deterministic: the same grown board coves the same way every time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grown = generateMap(new Rng(seed), 14, 8, 5);
      expect(placeCove(grown)).toEqual(placeCove(grown));
    }
  });

  it('a board whose seed does not cove stays exactly as grown, in both orientations', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      let checked = 0;
      for (let seed = 1; seed <= 1000 && checked < 200; seed++) {
        if (boardHasCove(seed)) continue;
        checked++;
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed).cove).toBeUndefined();
      }
      expect(checked).toBe(200);
    }
  });
});
