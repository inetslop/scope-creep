import { describe, expect, it } from 'vitest';
import { chokeCells } from '../../src/core/choke';
import { generateMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/**
 * With the current staircase generator every standard board as grown already carries two choke
 * cells (a bend within Splash's range, like the one `ensureChoke` documents), so the "Two
 * chokes" node's guarantee is met by the board itself and the double fold in `ensureChokes`
 * stays dormant — it, like the single fold, guards boards a future generator change produces.
 * If a generator ever stops guaranteeing two on its own, this test fails loudly: the fold path
 * has never run and would need real attention then.
 */
describe('two chokes: the guarantee against the current generator', () => {
  for (const [cols, rows] of [
    [14, 8],
    [8, 14],
  ] as const) {
    it(`on ${cols}x${rows}: as-grown boards already carry two chokes, so the node's board is the as-grown one`, () => {
      for (let seed = 1; seed <= 100; seed++) {
        const grown = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 1); // bgen 1: the board as grown
        const two = generateMap(new Rng(seed), cols, rows, 5, 0, 1, 2, 2); // the node's board
        expect(chokeCells(grown).length).toBeGreaterThanOrEqual(2); // the fold never needs to fire
        expect(two).toEqual(grown); // byte-identical: the guarantee is met by the board itself
      }
    });
  }
});
