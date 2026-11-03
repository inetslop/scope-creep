import { describe, expect, it } from 'vitest';
import { roadStretches } from '../../src/core/cove';
import { boardFactMap, BOARD_FACT_SEEDS } from '../../src/core/boardFacts';
import { generateMap, kindAt, type Cell, type CellKind, type GameMap } from '../../src/core/map';
import { boardHasSlowStretch, placeSlowStretch, slowStretchHash, stretchBox, stretchCovered } from '../../src/core/slowStretch';
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

/** The stretch's geometry, read back off the board: three consecutive path cells — the middle three of the longest straight run of three or more (a tie: the smaller midpoint, the twin's rule), or around the seed's hash-picked bend when there is no such run — with a build cell on each side. */
function expectStretchShape(map: GameMap, seed: number): void {
  const cells = map.slowStretch!.cells;
  expect(cells.length).toBe(3);
  cells.forEach((c) => {
    expect(c.col >= 0 && c.col < map.cols && c.row >= 0 && c.row < map.rows).toBe(true);
    expect(kindAt(map, c.col, c.row)).toBe('path');
  });
  for (let i = 1; i < 3; i++) {
    expect(Math.abs(cells[i]!.col - cells[i - 1]!.col) + Math.abs(cells[i]!.row - cells[i - 1]!.row)).toBe(1);
  }
  expect(stretchCovered(map, cells)).toBe(true);
  const stretches = roadStretches(map.path).filter((s) => s.end - s.start + 1 >= 3);
  if (stretches.length > 0) {
    let best: { n: number; m: number } | undefined;
    for (const s of stretches) {
      const n = s.end - s.start + 1;
      const m = s.start + Math.floor((n - 1) / 2);
      if (!best || n > best.n || (n === best.n && m < best.m)) best = { n, m };
    }
    const m = best!.m;
    expect(cells).toEqual([map.path[m - 1]!, map.path[m]!, map.path[m + 1]!]); // the middle three (a run of three is taken whole)
  } else {
    // The rare no-straight-three board: around one bend, the bend the seed's hash picks.
    const bends: number[] = [];
    for (let i = 1; i < map.path.length - 1; i++) {
      if (map.path[i]!.col - map.path[i - 1]!.col !== map.path[i + 1]!.col - map.path[i]!.col || map.path[i]!.row - map.path[i - 1]!.row !== map.path[i + 1]!.row - map.path[i]!.row) bends.push(i);
    }
    expect(bends.length).toBeGreaterThan(0);
    const b = bends[slowStretchHash(seed) % bends.length]!;
    expect(cells).toEqual([map.path[b - 1]!, map.path[b]!, map.path[b + 1]!]);
  }
}

/** A hand-grown board: the path's cells are 'path', the rocks' are 'rock', the rest 'open'. */
function grown(cols: number, rows: number, path: Cell[], rocks: Cell[]): GameMap {
  const kinds: CellKind[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'open' as CellKind));
  for (const c of path) kinds[c.row]![c.col] = 'path';
  for (const r of rocks) kinds[r.row]![r.col] = 'rock';
  return { cols, rows, kinds, path, vertical: rows > cols };
}

describe('the slow stretch', () => {
  it('on 14x8 and 8x14: 1000 seeds stretch between one in fifteen and one in four, composing with the fork and the loop', () => {
    let stretched = 0, forkStretched = 0, loopStretched = 0;
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      for (let seed = 1; seed <= 1000; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed);
        expectValidPath(map);
        // Deterministic: a fresh identical call gives the same board (the board code's round-trip rule).
        expect(map).toEqual(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed));
        if (!map.slowStretch) continue;
        stretched++;
        if (map.fork) forkStretched++;
        if (map.loop) loopStretched++;
        expectStretchShape(map, seed);
      }
    }
    // Between one in fifteen and one in four of the boards carry the stretch (the roll is one in four, placement may fail).
    expect(stretched / 2000).toBeGreaterThanOrEqual(1 / 15);
    expect(stretched / 2000).toBeLessThanOrEqual(1 / 4);
    expect(forkStretched).toBeGreaterThan(0); // a forked board can carry it
    expect(loopStretched).toBeGreaterThan(0); // a looped board can carry it
  });

  it('boardHasSlowStretch is the seed hash: deterministic, one in four', () => {
    let hit = 0;
    for (let seed = 1; seed <= 4000; seed++) {
      expect(boardHasSlowStretch(seed)).toBe(boardHasSlowStretch(seed));
      hit += boardHasSlowStretch(seed) ? 1 : 0;
    }
    expect(hit).toBeGreaterThanOrEqual(850);
    expect(hit).toBeLessThanOrEqual(1150);
  });

  it('placeSlowStretch is deterministic: the same grown board stretches the same way every time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const grownMap = generateMap(new Rng(seed), 14, 8, 5);
      expect(placeSlowStretch(grownMap, seed)).toEqual(placeSlowStretch(grownMap, seed));
    }
  });

  it('a board whose seed does not roll the stretch has none, in both orientations', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      let checked = 0;
      for (let seed = 1; seed <= 1000 && checked < 200; seed++) {
        if (boardHasSlowStretch(seed)) continue;
        checked++;
        expect(generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 1, false, false, seed).slowStretch).toBeUndefined();
      }
      expect(checked).toBe(200);
    }
  });

  it('placement: a rock on a side of the run gives up (a quality promise, not a road feature), the longest run wins, a tie takes the smaller midpoint', () => {
    // The only three-or-more run (the row of five) has the rock on one of its middle sides: no room on both.
    const blocked = grown(6, 6, [
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
      { col: 4, row: 0 }, { col: 5, row: 0 },
    ], [{ col: 2, row: 0 }]);
    expect(placeSlowStretch(blocked, 42)).toBeUndefined();
    expect(stretchCovered(blocked, [{ col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }])).toBe(false);
    // The run of six beats the run of four: the middle three of the longer one, in walking order.
    const longest = grown(6, 6, [
      { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
      { col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 }, { col: 3, row: 4 }, { col: 3, row: 5 },
    ], []);
    const placedLong = placeSlowStretch(longest, 42)!;
    expect(placedLong.slowStretch!.cells).toEqual([
      { col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 },
    ]);
    expect(placedLong.kinds).toEqual(longest.kinds); // never moves a cell
    // Two runs of five: the smaller midpoint (the twin's tie rule) takes the stretch.
    const tie = grown(10, 5, [
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
      { col: 4, row: 2 }, { col: 4, row: 3 }, { col: 4, row: 4 },
      { col: 5, row: 4 }, { col: 6, row: 4 }, { col: 7, row: 4 }, { col: 8, row: 4 },
    ], []);
    expect(placeSlowStretch(tie, 42)!.slowStretch!.cells).toEqual([
      { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
    ]);
  });

  it('a no-straight-three board takes the three cells around the hash-picked bend, and gives up when its flanks are blocked', () => {
    const staircase = (rocks: Cell[]): GameMap => grown(5, 5, [
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 2, row: 3 }, { col: 3, row: 3 }, { col: 3, row: 4 },
    ], rocks);
    // Seed 42's hash picks the second bend (corner (1,2)): the run around it, in walking order.
    const placed = placeSlowStretch(staircase([]), 42)!;
    expect(placed.slowStretch!.cells).toEqual([
      { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 2, row: 2 },
    ]);
    // A rock on one of the corner's two flanks (not the run's cells): the board grows without the stretch.
    expect(placeSlowStretch(staircase([{ col: 0, row: 2 }]), 42)).toBeUndefined();
  });

  it('stretchBox is the union of the three cells in board units', () => {
    const straight = placeSlowStretch(grown(6, 6, [
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
      { col: 4, row: 0 }, { col: 5, row: 0 },
    ], []), 42)!;
    expect(stretchBox(straight.slowStretch!, 10)).toEqual({ minX: 10, minY: 10, maxX: 40, maxY: 20 });
    const bent = placeSlowStretch(grown(5, 5, [
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 2, row: 3 }, { col: 3, row: 3 }, { col: 3, row: 4 },
    ], []), 42)!;
    expect(stretchBox(bent.slowStretch!, 10)).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 30 });
  });

  it('the fact row is committed to seed 14, the smallest free seed with a stretch on the row board', () => {
    expect(BOARD_FACT_SEEDS.slowstretch).toEqual({ seed: 14 });
    const used = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 15]);
    let smallest = -1;
    for (let n = 1; n <= 200; n++) {
      if (used.has(n)) continue;
      if (generateMap(new Rng(n), 8, 14, 5, 0, 1, 2, 1, false, false, n).slowStretch) { smallest = n; break; }
    }
    expect(smallest).toBe(14);
    expect(boardFactMap('slowstretch')?.slowStretch).toBeDefined();
  });
});
