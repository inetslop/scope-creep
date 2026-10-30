import { describe, expect, it } from 'vitest';
import { chokeCells } from '../../src/core/choke';
import { generateMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/**
 * The bgen-2 guarantee (core/choke.ts): every generated board carries at least one choke cell,
 * so the `board.choke` invariant holds on every board a run ever grows — including the level
 * 2 and 3 re-grown ones, whose windiest target (1.5 and up) takes runs of one cell (T0260).
 */
describe('every bgen-2 board carries a choke cell', () => {
  it('across the orientations, bends and road-length targets the run uses', () => {
    for (const mul of [1, 1.25, 1.5625]) {
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
});
