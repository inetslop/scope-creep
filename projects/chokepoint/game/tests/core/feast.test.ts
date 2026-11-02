import { describe, expect, it } from 'vitest';
import { towerSpec } from '../../src/core/augments';
import { chainAlive, feastChainWindowMs, feastDamageMul, FEAST_CHAIN_BASE_MS } from '../../src/core/feast';
import { getAugment } from '../../src/content/augments';
import { FEAST_WINDOW_EXTRA_SEC } from '../../src/content/augments/feast';
import type { AugmentCopy } from '../../src/content/types';

const copy = (id: string): AugmentCopy => ({ id, tier: 'epic' }); // Feast only exists as an Epic card

describe('the Feast def', () => {
  it('is an Epic-only support with no attack of its own; its added form lengthens the chain window', () => {
    const f = getAugment('feast');
    expect(f.tier).toBe('epic');
    expect(f.first).toMatchObject({ kind: 'pulse', damage: 0, runPower: true });
    expect(f.added.chainWindowSec).toBe(FEAST_WINDOW_EXTRA_SEC);
  });
});

describe('feastChainWindowMs', () => {
  it('is 1.5 s for one copy, +0.4 s per copy beyond the first, no cap', () => {
    expect(feastChainWindowMs(0)).toBe(1500);
    expect(feastChainWindowMs(1)).toBe(1500);
    expect(feastChainWindowMs(2)).toBe(1900);
    expect(feastChainWindowMs(3)).toBe(2300);
    expect(feastChainWindowMs(4)).toBe(2700);
    expect(feastChainWindowMs(1)).toBe(FEAST_CHAIN_BASE_MS);
  });
});

describe('chainAlive', () => {
  it('is alive at ×1 and ×3 within the window, broken at 0 or at/after expiry — a stale count included', () => {
    expect(chainAlive(1, 1000, 0, 1500)).toBe(true); // a lone kill: +4% for its 1.5 s
    expect(chainAlive(3, 1400, 0, 1500)).toBe(true);
    expect(chainAlive(3, 1500, 0, 1500)).toBe(false); // exactly at expiry
    expect(chainAlive(3, 2000, 0, 1500)).toBe(false); // past expiry, count not yet reset
    expect(chainAlive(0, 1000, 0, 1500)).toBe(false); // broken by a leak
  });
});

describe('feastDamageMul', () => {
  it('is 1 + 4% per chain level while a Feast stands and the chain lives', () => {
    expect(feastDamageMul(1, 1, 1000, 0, 1500)).toBeCloseTo(1.04);
    expect(feastDamageMul(1, 2, 1000, 0, 1500)).toBeCloseTo(1.08);
    expect(feastDamageMul(1, 10, 1000, 0, 1500)).toBeCloseTo(1.4);
    // the copies only need to exist; the level comes from the chain
    expect(feastDamageMul(3, 2, 1000, 0, 2300)).toBeCloseTo(1.08);
  });

  it('snaps back to 1 when the chain breaks, with no Feast, or at chain 0', () => {
    expect(feastDamageMul(1, 3, 2000, 0, 1500)).toBe(1); // expired (stale count)
    expect(feastDamageMul(0, 3, 1000, 0, 1500)).toBe(1); // no Feast on the board
    expect(feastDamageMul(1, 0, 1000, 0, 1500)).toBe(1); // a leak broke it
  });
});

describe('towerSpec feastCount', () => {
  it('counts Feast copies in any slot; the first is the tower that wears the plate', () => {
    const first = towerSpec([copy('feast')]);
    expect(first).toMatchObject({ firstId: 'feast', feastCount: 1, damage: 0 });
    expect(towerSpec([copy('feast'), copy('feast')]).feastCount).toBe(2);
    expect(towerSpec([copy('bolt'), copy('feast')]).feastCount).toBe(1); // added elsewhere: the buff is board-wide
    expect(towerSpec([copy('bolt'), copy('bolt')]).feastCount).toBe(0);
  });
});
