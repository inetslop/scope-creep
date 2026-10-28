import { describe, expect, it } from 'vitest';
import { towerSpec } from '../../src/core/augments';
import type { Cell } from '../../src/core/map';
import { chebyshev, mintGoldBonus, type MintTower } from '../../src/core/mint';
import type { AugmentCopy } from '../../src/content/types';

const cell = (col: number, row: number): Cell => ({ col, row });
const copy = (id: string): AugmentCopy => ({ id, tier: 'common' });
/** Mint only exists as an Epic card; its spec values do not differ by tier. */
const mintCopy = (): AugmentCopy => ({ id: 'mint', tier: 'epic' });
const tower = (col: number, row: number, ...copies: AugmentCopy[]): MintTower => ({ cell: cell(col, row), spec: towerSpec(copies) });

describe('chebyshev', () => {
  it('is the larger of the col and row gaps: a square, not a circle', () => {
    expect(chebyshev(cell(0, 0), cell(0, 0))).toBe(0);
    expect(chebyshev(cell(0, 0), cell(2, 1))).toBe(2);
    expect(chebyshev(cell(2, 2), cell(0, 0))).toBe(2);
    expect(chebyshev(cell(1, -1), cell(3, 1))).toBe(2);
    expect(chebyshev(cell(0, 0), cell(3, 0))).toBe(3);
    expect(chebyshev(cell(0, 0), cell(2, 3))).toBe(3);
  });
});

describe('mintGoldBonus', () => {
  it('a kill within 2 cells of a Mint tower (the 5x5 square, far corner in) pays +1; three away pays none', () => {
    const mint = tower(0, 0, mintCopy());
    const bolt = tower(1, 1, copy('bolt'));
    expect(mintGoldBonus([mint, bolt], cell(2, 2), bolt)).toBe(1); // the far corner is in
    expect(mintGoldBonus([mint, bolt], cell(-2, 1), bolt)).toBe(1); // a diagonal edge is in
    expect(mintGoldBonus([mint, bolt], cell(3, 0), bolt)).toBe(0); // one past the corner is out
    expect(mintGoldBonus([mint, bolt], cell(1, 3), bolt)).toBe(0);
  });

  it("a Bolt with a Mint in it pays +1 on its own kills; a second Mint makes it +2", () => {
    const bm = tower(0, 0, copy('bolt'), mintCopy());
    expect(mintGoldBonus([bm], cell(0, 0), bm)).toBe(1);
    const bmm = tower(0, 0, copy('bolt'), mintCopy(), mintCopy());
    expect(mintGoldBonus([bmm], cell(0, 0), bmm)).toBe(2);
  });

  it('a Mint-added Bolt inside a Mint tower radius earns both: +2 on one kill', () => {
    const mint = tower(0, 0, mintCopy());
    const bm = tower(2, 1, copy('bolt'), mintCopy());
    expect(mintGoldBonus([mint, bm], cell(2, 1), bm)).toBe(2);
  });

  it('a Mint tower that is the (hypothetical) killer pays its copies once, even inside its own radius', () => {
    const mint = tower(0, 0, mintCopy());
    expect(mintGoldBonus([mint], cell(0, 0), mint)).toBe(1);
    expect(mintGoldBonus([mint], cell(2, 2), mint)).toBe(1);
    const mm = tower(0, 0, mintCopy(), mintCopy());
    expect(mintGoldBonus([mm], cell(0, 0), mm)).toBe(2); // two copies, paid once each
  });

  it('a Mint tower with two Mints in it pays +2 on the kills within its radius', () => {
    const mm = tower(0, 0, mintCopy(), mintCopy());
    const bolt = tower(1, 0, copy('bolt'));
    expect(mintGoldBonus([mm, bolt], cell(1, 0), bolt)).toBe(2);
  });

  it('two Mint towers in range of one kill pay +2', () => {
    const a = tower(0, 0, mintCopy());
    const b = tower(0, 4, mintCopy());
    const bolt = tower(1, 2, copy('bolt'));
    expect(mintGoldBonus([a, b, bolt], cell(1, 2), bolt)).toBe(2);
  });
});
