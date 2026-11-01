import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { exitPoint, openFraction, pickFlyLine } from '../../src/core/flyRoute';
import { generateMap } from '../../src/core/map';
import { pathLineFor } from '../../src/core/path';
import { Rng } from '../../src/core/rng';

/**
 * The Flyer's crossing (core/flyRoute.ts): one straight line from a seeded point on the
 * entrance edge to the exit — the road's own end, never the road. These pin the spawn on the
 * entrance edge, the exit on the road line's end, the crossing (not a road-follow) and the
 * seed's determinism.
 */
describe('flyRoute', () => {
  for (const [cols, rows] of [
    [14, 8],
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: the spawn is on the entrance edge and the line is its whole path`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5);
        const fly = pickFlyLine(map, new Rng(seed), CELL);
        // The spawn is on the entrance edge: the left edge on a landscape board, the top edge on a portrait one.
        if (map.vertical) {
          expect(fly.spawn.y).toBe(0);
          expect(fly.spawn.x).toBeGreaterThan(0.5 * CELL);
          expect(fly.spawn.x).toBeLessThan((cols - 0.5) * CELL);
        } else {
          expect(fly.spawn.x).toBe(0);
          expect(fly.spawn.y).toBeGreaterThan(0.5 * CELL);
          expect(fly.spawn.y).toBeLessThan((rows - 0.5) * CELL);
        }
        // The exit is the road's own end: one cell past the exit gate, as pathLineFor walks it.
        const end = pathLineFor(map, CELL).pointAt(pathLineFor(map, CELL).length);
        expect(fly.exit).toEqual(end);
        expect(exitPoint(map, CELL)).toEqual(end);
        // The line is the two-point flight from the edge to the exit — one line for its whole life.
        expect(fly.line.points).toHaveLength(2);
        expect(fly.line.points[0]!).toEqual(fly.spawn);
        expect(fly.line.points[1]!).toEqual(fly.exit);
        // A crossing, not a road-follow: at least a fifth of the line runs over open build cells.
        expect(openFraction(map, CELL, fly.spawn, fly.exit)).toBeGreaterThanOrEqual(0.2);
      }
    });
  }

  it('is deterministic per seed: the same board and seed draw the same crossing', () => {
    for (const seed of [1, 7, 42]) {
      const map = generateMap(new Rng(seed), 14, 8, 5);
      const a = pickFlyLine(map, new Rng(seed), CELL);
      const b = pickFlyLine(map, new Rng(seed), CELL);
      expect(a.spawn).toEqual(b.spawn);
      expect(a.line.length).toBe(b.line.length);
    }
  });
});
