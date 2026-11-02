import { describe, expect, it } from 'vitest';
import { roadStretches } from '../../src/core/cove';
import { generateMap, kindAt, type Cell, type CellKind, type GameMap } from '../../src/core/map';
import { boardHasTwin, placeTwin } from '../../src/core/twin';
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

/** The twin's geometry, read back off the board: two build cells in mirror position around the road's midpoint cell of a three-or-more straight stretch. */
function expectTwinShape(map: GameMap): void {
  const twin = map.twin!;
  for (const c of [twin.a, twin.b]) {
    expect(c.col >= 0 && c.col < map.cols && c.row >= 0 && c.row < map.rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('open');
  }
  expect(Math.abs(twin.a.col - twin.b.col) + Math.abs(twin.a.row - twin.b.row)).toBe(2); // one cell off the road, one on each side
  const mid = { col: (twin.a.col + twin.b.col) / 2, row: (twin.a.row + twin.b.row) / 2 };
  expect(kindAt(map, mid.col, mid.row)).toBe('path');
  const i = map.path.findIndex((c) => c.col === mid.col && c.row === mid.row);
  const stretch = roadStretches(map.path).find((s) => s.start <= i && i <= s.end)!;
  const n = stretch.end - stretch.start + 1;
  expect(n).toBeGreaterThanOrEqual(3); // a straight stretch of three or more cells
  expect(i).toBe(stretch.start + Math.floor((n - 1) / 2)); // the stretch's midpoint cell
}

describe('the twin', () => {
  it('on 14x8 and 8x14: 1000 seeds twin between one in sixteen and one in five, never with the fork or the loop', () => {
    let twinned = 0;
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 1000; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        expectValidPath(map);
        // Deterministic: a fresh identical call gives the same board (the board code's round-trip rule).
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed));
        if (!map.twin) continue;
        twinned++;
        expect(map.fork).toBeUndefined(); // the twin never shares a board with the fork's or the loop's silhouette
        expect(map.loop).toBeUndefined();
        expectTwinShape(map);
      }
    }
    // Between one in sixteen and one in five of the boards carry the twin (the roll is one in four, placement may fail).
    expect(twinned / 2000).toBeGreaterThanOrEqual(0.06);
    expect(twinned / 2000).toBeLessThanOrEqual(0.22);
  });

  it('boardHasTwin is the seed hash: deterministic, one in four', () => {
    let twinned = 0;
    for (let seed = 1; seed <= 4000; seed++) {
      expect(boardHasTwin(seed)).toBe(boardHasTwin(seed));
      twinned += boardHasTwin(seed) ? 1 : 0;
    }
    expect(twinned).toBeGreaterThanOrEqual(850);
    expect(twinned).toBeLessThanOrEqual(1150);
  });

  it('placeTwin is deterministic: the same grown board twins the same way every time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grown = generateMap(new Rng(seed), 14, 8, 5);
      expect(placeTwin(grown)).toEqual(placeTwin(grown));
    }
  });

  it('a board whose seed does not twin has no twin, in both orientations', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      let checked = 0;
      for (let seed = 1; seed <= 1000 && checked < 200; seed++) {
        if (boardHasTwin(seed)) continue;
        checked++;
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed).twin).toBeUndefined();
      }
      expect(checked).toBe(200);
    }
  });

  it('placement: the longest stretch with room on both sides wins, a rock on a midpoint side skips that stretch', () => {
    const grown = (path: Cell[], rock: Cell): GameMap => {
      const kinds: CellKind[][] = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => 'open' as CellKind));
      for (const c of path) kinds[c.row]![c.col] = 'path';
      kinds[rock.row]![rock.col] = 'rock';
      return { cols: 6, rows: 6, kinds, path, vertical: false };
    };
    // The only three-or-more stretch (the row of five) has the rock on one of its midpoint sides: no room on both.
    const blocked = grown(
      [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
        { col: 3, row: 1 },
        { col: 4, row: 1 },
        { col: 4, row: 0 },
        { col: 5, row: 0 },
      ],
      { col: 2, row: 0 },
    );
    expect(placeTwin(blocked)).toBeUndefined();
    // The longer stretch's midpoint is blocked by the rock, so the longest stretch with room takes the pair; the cells stay as grown.
    const grownMap = grown(
      [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
        { col: 3, row: 2 },
        { col: 3, row: 1 },
        { col: 4, row: 1 },
        { col: 5, row: 1 },
      ],
      { col: 1, row: 1 },
    );
    const placed = placeTwin(grownMap)!;
    const cells = [placed.twin!.a, placed.twin!.b].map((c) => `${c.col},${c.row}`).sort();
    expect(cells).toEqual(['4,0', '4,2']);
    expect(placed.kinds).toEqual(grownMap.kinds);
  });
});
