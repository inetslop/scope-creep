import { describe, expect, it } from 'vitest';
import { chokeCells, ensureChokes } from '../../src/core/choke';
import { generateMap, kindAt, type GameMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/**
 * The bgen-2 guarantee (core/choke.ts): every generated board carries at least one choke cell,
 * so the `board.choke` invariant holds on every board a run plays — the plain road and the owned
 * long road alike.
 */
describe('every bgen-2 board carries a choke cell', () => {
  it('across the orientations, bends and road lengths (plain and the owned long road)', () => {
    for (const mul of [1, 1.25]) {
      for (const [cols, rows] of [
        [14, 8],
        [8, 14],
      ] as const) {
        for (let seed = 1; seed <= 40; seed++) {
          for (const bends of [0, 1]) {
            const map = generateMap(new Rng(seed), cols, rows, 5, bends, mul);
            expect(chokeCells(map).length, `${cols}x${rows} seed ${seed} bends ${bends} mul ${mul}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('with count 0 the guarantee is off: the grown board stands untouched, the same object (Plain)', () => {
    for (const [cols, rows] of [[14, 8], [8, 14]] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1);
        expect(ensureChokes(map, 0), `${cols}x${rows} seed ${seed}`).toBe(map);
      }
    }
  });

  it('a Plain board (grown without the guarantee) is a fully playable road with buildable cells', () => {
    for (const [cols, rows] of [[14, 8], [8, 14]] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        // Grown the run's own way: bgen 2, its shape rolls from its own seed, chokes 0.
        const map = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 0, false, false, seed);
        expectPlayableRoad(map, `${cols}x${rows} seed ${seed}`);
        expect(buildableCells(map), `${cols}x${rows} seed ${seed}`).toBeGreaterThan(0);
      }
    }
  });
});

/** The board's face is playable: a non-empty road, one step at a time, never on itself. */
function expectPlayableRoad(map: GameMap, label: string): void {
  const p = map.path;
  expect(p.length, label).toBeGreaterThan(0);
  const seen = new Set<string>();
  for (let i = 0; i < p.length; i++) {
    const c = p[i]!;
    expect(kindAt(map, c.col, c.row), `${label} path cell (${c.col},${c.row})`).toBe('path');
    const key = `${c.col},${c.row}`;
    expect(seen.has(key), `${label} crosses itself at (${c.col},${c.row})`).toBe(false);
    seen.add(key);
    if (i > 0) {
      const prev = p[i - 1]!;
      expect(Math.abs(c.col - prev.col) + Math.abs(c.row - prev.row), `${label} jumps at (${c.col},${c.row})`).toBe(1);
    }
  }
}

/** The board's buildable cells: towers need some to stand on. */
function buildableCells(map: GameMap): number {
  let n = 0;
  for (let row = 0; row < map.rows; row++) for (let col = 0; col < map.cols; col++) if (kindAt(map, col, row) === 'open') n++;
  return n;
}
