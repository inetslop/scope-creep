import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { towerSpec } from '../../src/core/augments';
import type { Cell } from '../../src/core/map';
import { inMintReach, mintGoldBonus, type MintTower } from '../../src/core/mint';
import { cellCenter, type Point } from '../../src/core/path';
import type { AugmentCopy } from '../../src/content/types';

const cell = (col: number, row: number): Cell => ({ col, row });
const copy = (id: string): AugmentCopy => ({ id, tier: 'common' });
/** Mint only exists as an Epic card; its spec values do not differ by tier. */
const mintCopy = (): AugmentCopy => ({ id: 'mint', tier: 'epic' });
const tower = (col: number, row: number, ...copies: AugmentCopy[]): MintTower => ({ cell: cell(col, row), spec: towerSpec(copies) });
/** A kill at the center of a cell, in board units. */
const spot = (col: number, row: number): Point => cellCenter(cell(col, row), CELL);

describe('inMintReach', () => {
  it('is the circle the range ring shows, not a square', () => {
    expect(inMintReach(cell(0, 0), spot(0, 0), 2)).toBe(true);
    expect(inMintReach(cell(0, 0), spot(2, 0), 2)).toBe(true); // two straight out is on the circle
    expect(inMintReach(cell(0, 0), spot(1, 1), 2)).toBe(true);
    expect(inMintReach(cell(0, 0), spot(2, 1), 2)).toBe(false); // 2.24 cells: outside the ring
    expect(inMintReach(cell(0, 0), spot(2, 2), 2)).toBe(false); // the square's far corner is out
    expect(inMintReach(cell(0, 0), spot(3, 0), 2)).toBe(false);
  });

  it('measures to the kill spot, not to the center of the cell it is in', () => {
    // 1.84 cells from the tower's center, in a cell whose center is 2.24 away.
    expect(inMintReach(cell(0, 0), { x: 2.2 * CELL, y: 1.2 * CELL }, 2)).toBe(true);
  });
});

describe('mintGoldBonus', () => {
  it('a kill inside a Mint tower\'s 2-cell ring pays +1; outside it pays none', () => {
    const mint = tower(0, 0, mintCopy());
    const bolt = tower(1, 1, copy('bolt'));
    expect(mintGoldBonus([mint, bolt], spot(1, 1), bolt)).toBe(1);
    expect(mintGoldBonus([mint, bolt], spot(-2, 0), bolt)).toBe(1); // on the ring
    expect(mintGoldBonus([mint, bolt], spot(2, 2), bolt)).toBe(0); // the square's corner is outside the ring
    expect(mintGoldBonus([mint, bolt], spot(-2, 1), bolt)).toBe(0);
    expect(mintGoldBonus([mint, bolt], spot(3, 0), bolt)).toBe(0);
  });

  it("a Bolt with a Mint in it pays +1 on its own kills; a second Mint makes it +2", () => {
    const bm = tower(0, 0, copy('bolt'), mintCopy());
    expect(mintGoldBonus([bm], spot(0, 0), bm)).toBe(1);
    const bmm = tower(0, 0, copy('bolt'), mintCopy(), mintCopy());
    expect(mintGoldBonus([bmm], spot(0, 0), bmm)).toBe(2);
  });

  it('a Mint-added Bolt inside a Mint tower radius earns both: +2 on one kill', () => {
    const mint = tower(0, 0, mintCopy());
    const bm = tower(1, 1, copy('bolt'), mintCopy());
    expect(mintGoldBonus([mint, bm], spot(1, 1), bm)).toBe(2);
  });

  it('a Mint tower that is the (hypothetical) killer pays its copies once, even inside its own radius', () => {
    const mint = tower(0, 0, mintCopy());
    expect(mintGoldBonus([mint], spot(0, 0), mint)).toBe(1);
    expect(mintGoldBonus([mint], spot(2, 2), mint)).toBe(1);
    const mm = tower(0, 0, mintCopy(), mintCopy());
    expect(mintGoldBonus([mm], spot(0, 0), mm)).toBe(2); // two copies, paid once each
  });

  it('a Mint tower with two Mints in it pays +2 on the kills within its radius', () => {
    const mm = tower(0, 0, mintCopy(), mintCopy());
    const bolt = tower(1, 0, copy('bolt'));
    expect(mintGoldBonus([mm, bolt], spot(1, 0), bolt)).toBe(2);
  });

  it('two Mint towers in range of one kill pay +2', () => {
    const a = tower(0, 0, mintCopy());
    const b = tower(0, 3, mintCopy());
    const bolt = tower(1, 2, copy('bolt'));
    expect(mintGoldBonus([a, b, bolt], spot(0, 2), bolt)).toBe(2);
  });
});
