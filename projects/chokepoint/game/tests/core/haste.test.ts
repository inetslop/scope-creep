import { describe, expect, it } from 'vitest';
import { AUGMENTS, getAugment } from '../../src/content/augments';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { draftPool, describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { Rng } from '../../src/core/rng';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('towerSpec haste (Haste)', () => {
  it('a lone Haste is a support aura: no damage of its own, 30% to both sides', () => {
    expect(spec('haste')).toMatchObject({ kind: 'rally', damage: 0, range: 2, hastePct: 0.3, hasteCount: 1 });
  });

  it('the first Haste copy in any slot sets the aura at 30%; each extra adds 15%', () => {
    expect(spec('bolt', 'haste')).toMatchObject({ hastePct: 0.3, hasteCount: 1 });
    expect(spec('haste', 'haste').hastePct).toBeCloseTo(0.45);
    expect(spec('haste', 'haste').hasteCount).toBe(2);
    expect(spec('haste', 'haste', 'haste').hastePct).toBeCloseTo(0.6);
    expect(spec('haste', 'haste', 'haste').hasteCount).toBe(3);
  });

  it('a Rally in the tower adds no haste (and vice versa: haste adds no rally)', () => {
    expect(spec('haste', 'rally')).toMatchObject({ hastePct: 0.3, hasteCount: 1 });
    expect(spec('rally', 'haste')).toMatchObject({ kind: 'rally', firstId: 'rally', hastePct: 0.3, hasteCount: 1 });
  });

  it('a Haste without any in the tower leaves the spec alone', () => {
    expect(spec('bolt')).toMatchObject({ hastePct: 0, hasteCount: 0 });
  });

  it('the tower line says both sides run faster, as a first and when added', () => {
    expect(describeSpec(spec('haste'))).toBe('Towers and enemies within 2 cells run 30% faster.');
    expect(describeSpec(spec('haste', 'haste'))).toBe('Towers and enemies within 2 cells run 45% faster.');
    expect(describeSpec(spec('bolt', 'haste'))).toContain('and towers and enemies within 2.6 cells run 30% faster');
    expect(describeSpec(spec('rally'))).toBe('Towers within 2 cells attack 10% faster.'); // the Rally line stays
  });
});

describe('draftPool (the tech gate)', () => {
  it('excludes the tech-gated augment until its node is owned, keeping the registry order', () => {
    expect(draftPool([]).map((a) => a.id)).toEqual(AUGMENTS.filter((a) => a.id !== 'haste').map((a) => a.id));
    expect(draftPool([]).some((a) => a.id === 'haste')).toBe(false);
    expect(draftPool(['gold-1']).some((a) => a.id === 'haste')).toBe(false); // another node does not unlock it
    expect(draftPool(['haste']).map((a) => a.id)).toEqual(AUGMENTS.map((a) => a.id)); // owned: the whole registry, in order
    expect(draftPool(['haste']).some((a) => a.id === 'haste')).toBe(true);
  });

  it('a node bought between runs takes effect: the pool is a pure function of the owned list', () => {
    expect(draftPool(['life-1', 'haste']).some((a) => a.id === 'haste')).toBe(true);
  });

  it('Haste rolls Epic-only when owned, and never opens the draft', () => {
    let seen = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed);
      for (const wave of [2, 5, 10]) {
        for (const c of rollOffer(rng, draftPool(['haste']), 3, wave)) {
          if (c.id === 'haste') {
            seen += 1;
            expect(c.tier).toBe('epic');
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    for (let seed = 1; seed <= 50; seed++) {
      expect(rollOffer(new Rng(seed), draftPool(['haste']), 3, 1, true).every((c) => c.id !== 'haste')).toBe(true);
    }
  });
});

describe('rollOffer with the gated pool', () => {
  it('never offers Haste while the node is not owned, across a run of drafts', () => {
    const rng = new Rng(1);
    for (let w = 1; w <= 15; w++) {
      const offer = rollOffer(rng, draftPool([]), 3, w, w === 0);
      expect(offer.every((c) => c.id !== 'haste')).toBe(true);
    }
  });

  it('an unowned profile rolls byte-identical offers to the registry without Haste', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const a = rollOffer(new Rng(seed), AUGMENTS.filter((x) => x.id !== 'haste'), 3, 4, false, ['bolt']);
      const b = rollOffer(new Rng(seed), draftPool([]), 3, 4, false, ['bolt']);
      expect(b).toEqual(a);
    }
  });

  it('haste is the only tech-gated augment in the registry', () => {
    expect(AUGMENTS.filter((a) => a.tech !== undefined).map((a) => a.id)).toEqual(['haste']);
    expect(getAugment('haste').tech).toBe('haste');
  });
});
