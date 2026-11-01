import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { CHOKES_RANGE, chokeCells } from '../../src/core/choke';
import { farGateCell, farGateDistance, farGateSplit, isFarGateSpawn } from '../../src/core/farGate';
import { generateMap, kindAt, type GameMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';
import type { WavePlan } from '../../src/core/waves';

/** The path index of the board's far gate cell, -1 when there is none. */
const farGateIndex = (map: GameMap): number =>
  map.farGate ? map.path.findIndex((c) => c.col === map.farGate!.col && c.row === map.farGate!.row) : -1;

/** A throwaway plan with `n` indistinguishable spawns, for the send rule's index math. */
const planOf = (n: number, number: number, tags: string[] = []): WavePlan =>
  ({ number, spawns: Array.from({ length: n }, () => ({ enemy: 'dot', delaySec: 0 })), hpMul: 1, tags });

/** A straight, choke-free road five cells long, so short the guard is the only reason it has no far gate. */
const SHORT_ROAD: GameMap = {
  cols: 5,
  rows: 3,
  vertical: false,
  kinds: [
    ['open', 'open', 'open', 'open', 'open'],
    ['path', 'path', 'path', 'path', 'path'],
    ['open', 'open', 'open', 'open', 'open'],
  ],
  path: [
    { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
    { col: 3, row: 1 }, { col: 4, row: 1 },
  ],
};

/**
 * The far gate (core/farGate.ts): a board about one in three grows a second entrance, about a third
 * of the way in, and a wave sends every third spawn through it. These pin the gate's placement
 * (a clear, straight cell at least two steps in and at most halfway down the road) and the send
 * rule (every third spawn, boss waves and no-far-gate runs excepted); the board's own far gate is
 * what farGateCell stamps, and its board distance is what WaveSystem hands its far gate spawns.
 */
describe('farGate', () => {
  describe('farGateCell', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      it(`on ${cols}x${rows}: the far gate is a clear, straight cell at least two steps in and at most halfway down the road`, () => {
        let withGate = 0;
        for (let seed = 1; seed <= 600; seed++) {
          const map = generateMap(new Rng(seed), cols, rows, 5);
          const i = farGateIndex(map);
          if (i === -1) continue; // no far gate: the board's roll missed, or the window found no cell
          withGate++;
          // The board's own far gate is what farGateCell stamps (the roll is the board's last rng draw).
          expect(farGateCell(map)).toEqual(map.farGate);
          // On the path, at least two steps in, at most halfway down.
          expect(kindAt(map, map.farGate!.col, map.farGate!.row)).toBe('path');
          expect(i).toBeGreaterThanOrEqual(2);
          expect(i).toBeLessThanOrEqual(Math.floor(map.path.length / 2));
          // Straight: its two path neighbours are along the same line as itself.
          const a = map.path[i - 1]!, b = map.path[i]!, c = map.path[i + 1]!;
          expect((b.col - a.col) * (c.row - b.row) === (b.row - a.row) * (c.col - b.col)).toBe(true);
          // Clear of a choke cell (a choke tower would sit on the gate).
          for (const choke of chokeCells(map)) {
            expect(Math.hypot(choke.col - b.col, choke.row - b.row)).toBeGreaterThan(CHOKES_RANGE);
          }
        }
        // A minority of boards grow the far gate (the roll is ~1 in 3, and the window keeps it
        // only when a clear, straight cell still survives the chokes): enough that the checks
        // above run, far from all of them.
        expect(withGate).toBeGreaterThanOrEqual(10);
        expect(withGate).toBeLessThan(200);
      });
    }

    it('a short road has no far gate: the guard, not a missing clear cell, is why', () => {
      expect(farGateCell(SHORT_ROAD)).toBeUndefined();
    });
  });

  describe('farGateDistance', () => {
    for (const [cols, rows] of [
      [14, 8],
      [8, 14],
    ] as const) {
      it(`on ${cols}x${rows}: 0 without a far gate, and the far gate cell's board distance when there is one`, () => {
        for (let seed = 1; seed <= 40; seed++) {
          const map = generateMap(new Rng(seed), cols, rows, 5);
          const i = farGateIndex(map);
          if (i === -1) {
            expect(farGateDistance(map)).toBe(0);
            continue;
          }
          const d = farGateDistance(map);
          // Board units from the route start (one cell before the entrance) to the far gate cell's center.
          expect(d).toBe((i + 1) * CELL);
          // Strictly inside the road: at least three cells in, and less than the way out.
          expect(d).toBeGreaterThan(2 * CELL);
          expect(d).toBeLessThan(map.path.length * CELL);
        }
      });
    }
  });

  describe('farGateSplit', () => {
    it('is the count of every third spawn: floor(n / 3)', () => {
      for (let n = 0; n <= 30; n++) expect(farGateSplit(n)).toBe(Math.floor(n / 3));
    });
  });

  describe('isFarGateSpawn', () => {
    it('is false without a far gate', () => {
      for (let i = 0; i < 12; i++) expect(isFarGateSpawn(i, planOf(12, 5), false)).toBe(false);
    });

    it('is false on boss waves', () => {
      for (const number of [10, 20, 30]) { // the boss waves: one big shape instead of a crowd
        const plan = planOf(9, number); // nine spawns: the 3rd, 6th, 9th would be far gate
        for (const i of [2, 5, 8]) expect(isFarGateSpawn(i, plan, true)).toBe(false);
      }
    });

    it('sends every third spawn through when there is a far gate', () => {
      for (const n of [3, 4, 6, 7, 8, 9, 10, 12]) {
        const plan = planOf(n, 5);
        for (let i = 0; i < n; i++) expect(isFarGateSpawn(i, plan, true), `index ${i} of ${n}`).toBe(i % 3 === 2);
      }
    });

    it('sends none through when the wave is too short for a far gate', () => {
      for (const n of [0, 1, 2]) { // shorter than the first far gate (n < 3)
        const plan = planOf(n, 5);
        for (let i = 0; i < n; i++) expect(isFarGateSpawn(i, plan, true)).toBe(false);
      }
    });
  });
});
