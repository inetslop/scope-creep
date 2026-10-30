import { describe, expect, it } from 'vitest';
import { anchor } from '../../src/content/augments/anchor';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { AUGMENTS } from '../../src/content/augments';
import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { applyRoot, tickRoot, type RootState } from '../../src/core/root';
import { Rng } from '../../src/core/rng';
import { tierAddedLine, tierTowerLine } from '../../src/core/tiers';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('anchor (root)', () => {
  it('a lone Anchor is a support pulse: no damage, roots everything in 2.5 cells every 3s', () => {
    expect(spec('anchor')).toMatchObject({ kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 3, root: { sec: 0.75 } });
  });

  it('a second Anchor in the same tower lengthens every root it applies by 0.25s', () => {
    expect(spec('anchor', 'anchor').root?.sec).toBeCloseTo(1);
  });

  it('each extra Anchor adds 0.25s to the roots of the tower it is in', () => {
    expect(spec('bolt', 'anchor', 'anchor').root?.sec).toBeCloseTo(0.75); // 0.5 + 0.25, not the second copy's own 0.5
    expect(spec('frost', 'anchor', 'anchor').root?.sec).toBeCloseTo(0.75);
  });

  it('rolls from Rare up; the Rare is the base, the Epic roots 1s every 2.6s', () => {
    expect(anchor.minTier).toBe('rare');
    expect(anchor.tier).toBeUndefined();
    expect(towerSpec([copy('anchor', 'rare')]).root?.sec).toBeCloseTo(0.75);
    expect(towerSpec([copy('anchor', 'rare')]).rate).toBeCloseTo(1 / 3);
    expect(towerSpec([copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1);
    expect(towerSpec([copy('anchor', 'epic')]).rate).toBeCloseTo(1 / 2.6);
    expect(towerSpec([copy('anchor', 'epic'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1.25);
    expect(towerSpec([copy('bolt'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(0.75);
    let seen = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 30)) {
        if (c.id !== 'anchor') continue;
        expect(c.tier).not.toBe('common');
        seen += 1;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('Frost and Anchor keep both: the slow and the root', () => {
    const s = spec('frost', 'anchor');
    expect(s.slow?.pct).toBe(0.4);
    expect(s.root?.sec).toBeCloseTo(0.5);
  });

  it("the card's lines state each tier's numbers", () => {
    expect(tierTowerLine(anchor, 'rare')).toBe('Roots everything within 2.5 cells for 0.75s, every 3s.');
    expect(tierAddedLine(anchor, 'rare')).toBe('Hits root for 0.5s (+0.25s per extra Anchor).');
    expect(tierTowerLine(anchor, 'epic')).toBe('Roots everything within 2.5 cells for 1s, every 2.6s.');
    expect(tierAddedLine(anchor, 'epic')).toBe('Hits root for 0.75s (+0.25s per extra Anchor).');
  });

  it('the tower line says what the combination does', () => {
    expect(describeSpec(spec('anchor'))).toMatch(/Roots everything around it for 0.75s/);
    expect(describeSpec(spec('bolt', 'anchor'))).toMatch(/roots them for 0.5s/);
  });
});

describe('the root holds for its own time', () => {
  const fresh = (): RootState => ({ rootLeft: 0 });

  it('a root holds for its time, is never refreshed while it holds, and once it wears off a new root takes hold again immediately', () => {
    const s = fresh();
    expect(applyRoot(s, 0.5)).toBe(true);
    expect(applyRoot(s, 1)).toBe(false); // never refreshed or extended while it holds
    tickRoot(s, 0.5);
    expect(s).toEqual({ rootLeft: 0 });
    expect(applyRoot(s, 0.5)).toBe(true); // the fatigue that stops a re-root lives in core/control.ts, not here
  });
});
