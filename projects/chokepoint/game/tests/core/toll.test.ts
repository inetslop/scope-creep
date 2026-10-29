import { describe, expect, it } from 'vitest';
import { towerSpec } from '../../src/core/augments';
import { tollPay, type TollTower } from '../../src/core/toll';
import type { AugmentCopy } from '../../src/content/types';

/** Toll only exists as an Epic card; its spec values do not differ by tier. */
const toll = (): AugmentCopy => ({ id: 'toll', tier: 'epic' });
const spec = (...copies: AugmentCopy[]) => towerSpec(copies);
const tower = (...copies: AugmentCopy[]): TollTower => ({ spec: spec(...copies) });

describe('towerSpec: the toll per leak', () => {
  it('a Toll tower pays +2 per leak; each extra copy adds +1', () => {
    expect(spec(toll()).tollPerLeak).toBe(2);
    expect(spec(toll(), toll()).tollPerLeak).toBe(3);
    expect(spec(toll(), toll(), toll()).tollPerLeak).toBe(4);
  });

  it('keeps one count per copy, for the ticks', () => {
    expect(spec(toll()).tollCount).toBe(1);
    expect(spec(toll(), toll()).tollCount).toBe(2);
    expect(spec(toll(), toll(), toll()).tollCount).toBe(3);
  });

  it('an added Toll pays +1 on the tower it is in, whatever attacks it', () => {
    expect(spec({ id: 'bolt', tier: 'common' }, toll()).tollPerLeak).toBe(1);
    expect(spec({ id: 'bolt', tier: 'common' }, toll(), toll()).tollPerLeak).toBe(2);
    expect(spec(toll()).tollCount).toBe(1);
    expect(spec({ id: 'bolt', tier: 'common' }, toll()).tollCount).toBe(1);
  });

  it('a Toll first is a support: a pulse that deals no damage', () => {
    const s = spec(toll());
    expect(s.kind).toBe('pulse');
    expect(s.damage).toBe(0);
    expect(s.firstId).toBe('toll');
  });

  it('no Toll in the tower: nothing to pay', () => {
    expect(spec({ id: 'bolt', tier: 'common' }).tollPerLeak).toBe(0);
    expect(spec({ id: 'bolt', tier: 'common' }).tollCount).toBe(0);
  });
});

describe('tollPay', () => {
  it('sums the towers on the board: two single-copy tolls pay +4 on one leak', () => {
    expect(tollPay([tower(toll()), tower(toll())])).toBe(4);
    expect(tollPay([tower(toll()), tower(toll(), toll())])).toBe(5); // 2 + 3
    expect(tollPay([tower(toll())])).toBe(2);
    expect(tollPay([tower(toll(), toll())])).toBe(3);
  });

  it('mixes with towers that pay no toll', () => {
    expect(tollPay([tower(toll()), tower({ id: 'bolt', tier: 'common' })])).toBe(2);
  });

  it('pays nothing with no Toll tower on the board', () => {
    expect(tollPay([])).toBe(0);
    expect(tollPay([tower({ id: 'bolt', tier: 'common' }), tower({ id: 'frost', tier: 'common' })])).toBe(0);
  });
});
