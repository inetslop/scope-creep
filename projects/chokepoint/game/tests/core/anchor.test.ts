import { describe, expect, it } from 'vitest';
import { anchor } from '../../src/content/augments/anchor';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { AUGMENTS } from '../../src/content/augments';
import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { applyRoot, ROOT_IMMUNE_SEC, tickRoot, type RootState } from '../../src/core/root';
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

  it('only rolls as an Epic card, and the Epic card has the base values', () => {
    expect(anchor.tier).toBe('epic');
    expect(towerSpec([copy('anchor', 'epic')]).root?.sec).toBeCloseTo(0.75);
    expect(towerSpec([copy('anchor', 'epic'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(1);
    expect(towerSpec([copy('bolt'), copy('anchor', 'epic')]).root?.sec).toBeCloseTo(0.5);
    let seen = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 30)) {
        if (c.id !== 'anchor') continue;
        expect(c.tier).toBe('epic');
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

  it("the Epic card's lines are the base lines", () => {
    expect(tierTowerLine(anchor, 'epic')).toBe('Roots everything within 2.5 cells for 0.75s, every 3s.');
    expect(tierAddedLine(anchor, 'epic')).toBe('Hits root for 0.5s (+0.25s per extra Anchor).');
  });

  it('the tower line says what the combination does', () => {
    expect(describeSpec(spec('anchor'))).toMatch(/Roots everything around it for 0.75s/);
    expect(describeSpec(spec('bolt', 'anchor'))).toMatch(/roots them for 0.5s/);
  });
});

describe('the root never holds for good', () => {
  const fresh = (): RootState => ({ rootLeft: 0, rootImmuneLeft: 0 });
  /** Seconds out of `total` that an enemy hit every `period` seconds with a `sec` root spends rooted. */
  const rootedTime = (sec: number, period: number, total = 30, dt = 1 / 60): number => {
    const s = fresh();
    let rooted = 0;
    let next = 0;
    for (let t = 0; t < total; t += dt) {
      if (t >= next) {
        applyRoot(s, sec);
        next += period;
      }
      if (s.rootLeft > 0) rooted += dt;
      tickRoot(s, dt);
    }
    return rooted / total;
  };

  it('a root holds for its time, then the enemy shrugs roots off for ROOT_IMMUNE_SEC', () => {
    const s = fresh();
    expect(applyRoot(s, 0.5)).toBe(true);
    expect(applyRoot(s, 1)).toBe(false); // never refreshed or extended while it holds
    tickRoot(s, 0.5);
    expect(s).toEqual({ rootLeft: 0, rootImmuneLeft: ROOT_IMMUNE_SEC });
    expect(applyRoot(s, 0.5)).toBe(false);
    tickRoot(s, ROOT_IMMUNE_SEC);
    expect(s.rootImmuneLeft).toBe(0);
    expect(applyRoot(s, 0.5)).toBe(true);
  });

  it('Splash with an Anchor added (a 0.5s root every 1s) stops an enemy about a fifth of the time, not half', () => {
    expect(rootedTime(0.5, 1)).toBeLessThan(0.25);
  });

  it('a root as long as the pulse gap, or a faster tower, no longer holds everything in place', () => {
    expect(rootedTime(1, 1)).toBeLessThan(0.4);
    expect(rootedTime(0.75, 0.67)).toBeLessThan(0.35);
  });

  it('a lone Anchor tower (0.75s every 3s) roots on every pulse, as before', () => {
    expect(rootedTime(0.75, 3, 30)).toBeCloseTo(0.25, 1);
  });
});
