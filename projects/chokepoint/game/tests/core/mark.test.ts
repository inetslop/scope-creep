import { describe, expect, it } from 'vitest';
import { AUGMENTS, getAugment } from '../../src/content/augments';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { Rng } from '../../src/core/rng';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('the mark', () => {
  it('a Mark tower is a support attack: no damage, no barrels, marks for +25%', () => {
    const s = spec('mark');
    expect(s).toMatchObject({ attacks: true, kind: 'mark', damage: 0, range: 3, markPct: 0.25, markCount: 1, bolts: 0 });
    expect(s.rate).toBeCloseTo(1 / 1.2);
  });

  it('every Mark in the tower adds +25%, whichever slot it is in', () => {
    expect(spec('mark', 'mark')).toMatchObject({ markPct: 0.5, markCount: 2 });
    expect(spec('bolt', 'mark')).toMatchObject({ kind: 'shot', markPct: 0.25, markCount: 1 });
    expect(spec('bolt', 'mark', 'mark')).toMatchObject({ markPct: 0.5, markCount: 2 });
    expect(spec('splash', 'mark').markPct).toBe(0.25);
    expect(spec('frost', 'mark').markPct).toBe(0.25);
  });

  it('a Mark tower gets no bolts from Bolt, and its own range still scales', () => {
    expect(spec('mark', 'bolt').bolts).toBe(0);
    expect(spec('mark', 'reach').range).toBeCloseTo(3 * 1.35);
  });

  it('the panel line says who it marks', () => {
    expect(describeSpec(spec('mark'))).toMatch(/mark/i);
    expect(describeSpec(spec('mark'))).toMatch(/25%/);
    expect(describeSpec(spec('bolt', 'mark'))).toMatch(/mark/i);
    expect(describeSpec(spec('frost', 'mark'))).toMatch(/mark/i);
  });

  it('is Epic-only and may open a run; no other augment limits its tier', () => {
    const m = getAugment('mark');
    expect(m.tier).toBe('epic');
    expect(m.opening).toBe(true);
    for (const a of AUGMENTS) if (a.id !== 'mark') expect(a.tier).toBeUndefined();
  });

  it('the opening draft may offer a Mark, alongside the damaging augments', () => {
    for (let seed = 1; seed <= 30; seed++)
      expect(rollOffer(new Rng(seed), AUGMENTS, 3, 1, true).every((c) => getAugment(c.id).first.damage > 0 || getAugment(c.id).opening)).toBe(true);
  });

  it('over many seeded drafts, a Mark card only ever rolls as Epic', () => {
    let marks = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 5)) {
        const def = getAugment(c.id);
        if (def.tier) expect(c.tier).toBe(def.tier);
        if (c.id === 'mark') {
          marks += 1;
          expect(c.tier).toBe('epic');
        }
      }
    }
    expect(marks).toBeGreaterThan(0);
  });
});
