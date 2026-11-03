import { describe, expect, it } from 'vitest';
import { GRID, ROCKS } from '../../src/config';
import { chokeCells } from '../../src/core/choke';
import { generateMap } from '../../src/core/map';
import { Rng } from '../../src/core/rng';

/**
 * A Plain board is grown with chokes 0: it stands exactly as grown, with no guaranteed choke.
 * That is a quality promise, not a road feature, because every bgen-2 board already carries its
 * natural choke cells — the guarantee (chokes 1) folds nothing into any of them. The board
 * facts' plain row relies on this: its committed seed's board is unchanged by the guarantee.
 */
describe('a plain board stands as grown', () => {
  it('every bgen-2 board already carries a natural choke cell, in either orientation', () => {
    for (const [cols, rows] of [[GRID.short, GRID.long], [GRID.long, GRID.short]] as const) {
      for (let seed = 1; seed <= 60; seed++) {
        const plain = generateMap(new Rng(seed), cols, rows, ROCKS, 0, 1, 2, 0, false, false, seed);
        expect(chokeCells(plain).length, `${cols}x${rows} seed ${seed}`).toBeGreaterThan(0);
      }
    }
  });
});
