import { describe, expect, it } from 'vitest';
import { MAX_SLOTS } from '../../src/config';
import { AUGMENTS, getAugment } from '../../src/content/augments';
import { rapid } from '../../src/content/augments/rapid';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, rollOffer, slotCost, towerColor, towerSpec } from '../../src/core/augments';
import { Rng } from '../../src/core/rng';
import { rollTier, tierAddedLine, tierFirst } from '../../src/core/tiers';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('towerSpec', () => {
  it('an empty tower does nothing; every augment can be the first', () => {
    expect(spec().attacks).toBe(false);
    for (const a of AUGMENTS) expect(spec(a.id)).toMatchObject({ attacks: true, firstId: a.id, kind: a.first.kind });
  });

  it('the first augment decides the attack', () => {
    expect(spec('bolt').kind).toBe('shot');
    expect(spec('splash').kind).toBe('pulse');
    expect(spec('reach').range).toBeGreaterThan(4);
    expect(spec('rapid').rate).toBeGreaterThan(3);
    expect(spec('frost').damage).toBe(0);
    expect(spec('frost').slow?.pct).toBe(0.4);
  });

  it('later augments add their values', () => {
    expect(spec('bolt', 'rapid').rate).toBeCloseTo(spec('bolt').rate * 1.5);
    expect(spec('bolt', 'rapid').damage).toBeCloseTo(spec('bolt').damage * 0.75);
    expect(spec('bolt', 'reach').range).toBeCloseTo(spec('bolt').range * 1.35);
    expect(spec('bolt', 'frost').slow?.pct).toBe(0.4);
    expect(spec('bolt', 'bolt').shots).toBe(2);
    expect(spec('bolt', 'splash').splash).toBe(1);
    expect(describeSpec(spec('bolt', 'splash'))).toMatch(/burst/);
  });

  it('on a pulse tower, Splash reaches further and Bolt adds shots with its own damage', () => {
    expect(spec('splash', 'splash').range).toBe(spec('splash').range + 1);
    expect(spec('frost', 'bolt').bolts).toBe(1);
    expect(spec('frost', 'bolt').boltDamage).toBeGreaterThan(0);
    expect(spec('frost', 'bolt').damage).toBe(0);
  });

  it('Splash does not make anything weaker', () => {
    expect(spec('bolt', 'splash').damage).toBe(spec('bolt').damage);
    expect(spec('frost', 'splash').slow?.pct).toBe(spec('frost').slow?.pct);
  });

  it('every damaging first augment can hold wave 1: similar damage per second', () => {
    const dps = AUGMENTS.filter((a) => a.first.damage > 0).map((a) => a.first.damage * a.first.rate);
    expect(Math.min(...dps)).toBeGreaterThan(12);
    expect(Math.max(...dps) / Math.min(...dps)).toBeLessThan(2);
  });

  it('a tower shows its first augment color', () => {
    expect(towerColor(['frost', 'splash'].map((id) => copy(id)))).toBe(getAugment('frost').look.color);
    expect(towerColor([])).toBeUndefined();
  });
});

describe('pierce (Lance)', () => {
  it('a lone Lance is a piercing shot', () => {
    expect(spec('lance')).toMatchObject({ kind: 'shot', pierce: 1 });
  });

  it('Lance added gives one more pierce to any tower; a second Lance stacks', () => {
    expect(spec('bolt', 'lance').pierce).toBe(1);
    expect(spec('lance', 'lance').pierce).toBe(2);
  });

  it('a pulse given pierce fires that many bolts, which keep going', () => {
    expect(spec('frost', 'lance')).toMatchObject({ bolts: 1, pierce: 1 });
  });
});

describe('mint gold (Mint)', () => {
  it('a Mint tower does not attack; kills within 2 cells pay +1 per copy in it', () => {
    expect(spec('mint')).toMatchObject({ goldRadius: 2, goldPerKill: 1, damage: 0 });
    expect(spec('bolt', 'mint', 'mint').goldPerKill).toBe(2); // copies stack, any slot
    expect(spec('bolt', 'mint').goldRadius).toBe(0); // the radius is only the first form's
  });

  it('the tower line mentions the extra gold, and the other lines stay', () => {
    expect(describeSpec(spec('mint'))).toBe('Does not attack, kills within 2 cells drop +1 gold.');
    expect(describeSpec(spec('bolt', 'mint'))).toContain('kills drop +1 gold');
    expect(describeSpec(spec('bolt', 'mint', 'mint'))).toContain('kills drop +2 gold');
    expect(describeSpec(spec('frost'))).toBe('Slows everything around it by 40%.');
    expect(describeSpec(spec('frost', 'bolt'))).toBe('Slows everything around it by 40%, and shoots the enemy furthest along.');
  });
});

describe('tiers', () => {
  it('a Rare and Epic Rapid tower deals more damage and attacks faster', () => {
    expect(towerSpec([copy('rapid', 'rare')]).damage).toBeCloseTo(5 * 1.3);
    expect(towerSpec([copy('rapid', 'rare')]).rate).toBeCloseTo(4 / 0.85);
    expect(towerSpec([copy('rapid', 'epic')]).damage).toBeCloseTo(5 * 1.7);
    expect(towerSpec([copy('rapid', 'epic')]).rate).toBeCloseTo(4 / 0.7);
  });

  it("a Rare Rapid added to a tower uses the Rare added form", () => {
    expect(towerSpec([copy('bolt'), copy('rapid', 'rare')]).rate).toBeCloseTo(1.6 * 1.65);
    expect(towerSpec([copy('bolt'), copy('rapid', 'rare')]).damage).toBeCloseTo(12 * 0.75);
  });

  it("Reach added uses the tier's range multiplier", () => {
    expect(towerSpec([copy('bolt'), copy('reach', 'rare')]).range).toBeCloseTo(2.6 * 1.45);
    expect(towerSpec([copy('bolt'), copy('reach', 'epic')]).range).toBeCloseTo(2.6 * 1.55);
  });

  it("Splash added uses the tier's splash", () => {
    expect(towerSpec([copy('bolt'), copy('splash', 'rare')]).splash).toBeCloseTo(1.5);
    expect(towerSpec([copy('bolt'), copy('splash', 'epic')]).splash).toBeCloseTo(2);
  });

  it("a Rare Frost first tower slows by the tier's amount", () => {
    expect(towerSpec([copy('frost', 'rare')]).slow?.pct).toBe(0.5);
  });

  it("the card's added line changes with the tier", () => {
    expect(tierAddedLine(rapid, 'rare')).toBe('Attacks 65% faster, hits 25% lighter.');
    expect(tierAddedLine(rapid, 'epic')).toBe('Attacks 85% faster, hits 25% lighter.');
    expect(tierAddedLine(rapid, 'common')).toBe(rapid.asAdded);
  });

  it('the Common tier is the base form, and the tiers never mutate the def', () => {
    const base = getAugment('rapid').first;
    expect(tierFirst(rapid, 'common')).toEqual(base);
    expect(tierFirst(rapid, 'rare')).not.toBe(rapid.first);
    expect(base).toEqual(rapid.first);
  });

  it('rollTier follows the odds over many seeded rolls', () => {
    const rng = new Rng(20261028);
    let common = 0;
    let rare = 0;
    let epic = 0;
    for (let i = 0; i < 6000; i++) {
      const t = rollTier(rng, 5);
      if (t === 'common') common += 1;
      else if (t === 'rare') rare += 1;
      else epic += 1;
    }
    expect(common / 6000).toBeGreaterThan(0.55);
    expect(epic / 6000).toBeLessThan(0.15);
    expect(epic).toBeGreaterThan(0);
    expect(common + rare + epic).toBe(6000);
  });

  it('draft offers eventually include Rare and Epic copies', () => {
    const seen = new Set<Tier>();
    for (let seed = 1; seed <= 300; seed++) for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 5)) seen.add(c.tier);
    expect(seen.has('rare')).toBe(true);
    expect(seen.has('epic')).toBe(true);
  });
});

describe('slotCost', () => {
  it('gets much more expensive per slot, up to the max', () => {
    for (let i = 1; i < MAX_SLOTS; i++) expect(slotCost(i)!).toBeGreaterThan(slotCost(i - 1)! * 1.5);
    expect(slotCost(MAX_SLOTS)).toBeUndefined();
  });
});

describe('rollOffer', () => {
  it('the opening draft only offers augments that deal damage, or may open', () => {
    for (let seed = 1; seed <= 30; seed++)
      expect(rollOffer(new Rng(seed), AUGMENTS, 3, 1, true).every((c) => getAugment(c.id).first.damage > 0 || getAugment(c.id).opening)).toBe(true);
  });

  it('rolls Mint only as an Epic card, across many seeds', () => {
    let seen = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed);
      for (const wave of [1, 5, 10]) {
        for (const c of rollOffer(rng, AUGMENTS, 3, wave, false)) {
          if (c.id === 'mint') {
            seen += 1;
            expect(c.tier).toBe('epic');
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('offers three different augments', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const offer = rollOffer(new Rng(seed), AUGMENTS, 3, 1);
      expect(offer.length).toBe(3);
      expect(new Set(offer.map((a) => a.id)).size).toBe(3);
    }
  });

  it('the opening draft (and its reroll) always offers a Common Bolt', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const offer = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true);
      expect(offer.length).toBe(3);
      expect(new Set(offer.map((a) => a.id)).size).toBe(3);
      expect(offer.some((c) => c.id === 'bolt' && c.tier === 'common')).toBe(true);
    }
  });

  it('no Bolt promise after wave 1: some later draft rolls no Bolt at all', () => {
    let noBolt = 0;
    for (let seed = 1; seed <= 200; seed++) if (!rollOffer(new Rng(seed), AUGMENTS, 3, 2).some((c) => c.id === 'bolt')) noBolt += 1;
    expect(noBolt).toBeGreaterThan(0);
  });
});
