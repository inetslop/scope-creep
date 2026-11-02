import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { bankedLine, exitPoint, firstLine, flyRouteFor, openFraction, pickFlyLine } from '../../src/core/flyRoute';
import { generateMap } from '../../src/core/map';
import { cellCenter, pathLineFor } from '../../src/core/path';
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

  // The boss Flyer's crossing (core/flyRoute.ts): one straight line from a point off the island's
  // entrance edge to the exit gate, banking once at half health to a seeded edge point. Seeded
  // from the board itself: the same board always gives the same crossing, a different board a
  // different one, and it never draws on the run's rng.
  describe("the boss Flyer's route (flyRouteFor)", () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      it(`on ${cols}x${rows}: spawn off the entrance edge (never its own row), bank on the edge, exit the gate`, () => {
        for (let seed = 1; seed <= 40; seed++) {
          const map = generateMap(new Rng(seed), cols, rows, 5);
          const route = flyRouteFor(map, CELL);
          // The exit gate: the center of the road's last cell (not one past it — the small Flyer's landing).
          expect(route.exit).toEqual(cellCenter(map.path[map.path.length - 1]!, CELL));
          if (map.vertical) {
            // Portrait: it lifts off the top edge, half a cell above the island.
            expect(route.spawn.y).toBe(-0.5 * CELL);
            const spawnCol = Math.floor(route.spawn.x / CELL);
            expect(spawnCol).toBeGreaterThanOrEqual(0);
            expect(spawnCol).toBeLessThan(cols);
            expect(spawnCol).not.toBe(map.path[0]!.col); // the line never leaves through the entrance gate
            // The bank lands on the left or right edge, clear of the two corner cells.
            expect([0, cols * CELL]).toContain(route.bank.x);
            expect(route.bank.y).toBeGreaterThanOrEqual(1.5 * CELL);
            expect(route.bank.y).toBeLessThanOrEqual((rows - 1.5) * CELL);
          } else {
            // Landscape: it lifts off the left edge, half a cell off the island.
            expect(route.spawn.x).toBe(-0.5 * CELL);
            const spawnRow = Math.floor(route.spawn.y / CELL);
            expect(spawnRow).toBeGreaterThanOrEqual(0);
            expect(spawnRow).toBeLessThan(rows);
            expect(spawnRow).not.toBe(map.path[0]!.row); // the line never leaves through the entrance gate
            // The bank lands on the top or bottom edge, clear of the two corner cells.
            expect([0, rows * CELL]).toContain(route.bank.y);
            expect(route.bank.x).toBeGreaterThanOrEqual(1.5 * CELL);
            expect(route.bank.x).toBeLessThanOrEqual((cols - 1.5) * CELL);
          }
        }
      });
    }

    it('is seeded from the board: the same board always gives the same crossing, a different board a different one', () => {
      const maps = [1, 7, 42].map((seed) => generateMap(new Rng(seed), 14, 8, 5));
      for (const map of maps) {
        const a = flyRouteFor(map, CELL);
        const b = flyRouteFor(map, CELL);
        expect(a.spawn).toEqual(b.spawn);
        expect(a.bank).toEqual(b.bank);
        expect(a.exit).toEqual(b.exit);
      }
      expect(maps.map((m) => JSON.stringify(flyRouteFor(m, CELL).spawn))).toHaveLength(new Set(maps.map((m) => JSON.stringify(flyRouteFor(m, CELL).spawn))).size);
    });

    it('firstLine is the straight crossing from spawn to the exit gate', () => {
      const map = generateMap(new Rng(1), 14, 8, 5);
      const route = flyRouteFor(map, CELL);
      const line = firstLine(route);
      expect(line.points).toHaveLength(2);
      expect(line.points[0]).toEqual(route.spawn);
      expect(line.points[1]).toEqual(route.exit);
      expect(line.length).toBeCloseTo(Math.hypot(route.exit.x - route.spawn.x, route.exit.y - route.spawn.y));
    });

    it('bankedLine is where it is now, to the edge bank point, on to the exit gate', () => {
      const map = generateMap(new Rng(1), 14, 8, 5);
      const route = flyRouteFor(map, CELL);
      const first = firstLine(route);
      for (const d of [10, first.length / 3, 0.8 * first.length]) {
        const from = first.pointAt(d);
        const line = bankedLine(route, from);
        expect(line.points).toHaveLength(3);
        expect(line.points[0]).toEqual(from);
        expect(line.points[1]).toEqual(route.bank);
        expect(line.points[2]).toEqual(route.exit);
        expect(line.length).toBeCloseTo(
          Math.hypot(route.bank.x - from.x, route.bank.y - from.y) + Math.hypot(route.exit.x - route.bank.x, route.exit.y - route.bank.y),
        );
      }
    });
  });
});
