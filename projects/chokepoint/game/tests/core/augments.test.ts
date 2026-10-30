import { describe, expect, it } from 'vitest';
import { MAX_SLOTS } from '../../src/config';
import { AUGMENTS, getAugment } from '../../src/content/augments';
import { beam } from '../../src/content/augments/beam';
import { rapid } from '../../src/content/augments/rapid';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, draftCardCount, rollOffer, slotCost, towerColor, towerSpec } from '../../src/core/augments';
import { towerDps } from '../../src/core/towerDps';
import { Rng } from '../../src/core/rng';
import { rollTier, tierAddedLine, tierFirst, tierTowerLine } from '../../src/core/tiers';

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
    // A Spray's pellets count against the wave's line: every pellet of the blast flies at once.
    const dps = AUGMENTS.filter((a) => a.first.damage > 0).map((a) => a.first.damage * a.first.rate * (a.first.spray ?? 1));
    expect(Math.min(...dps)).toBeGreaterThan(12);
    expect(Math.max(...dps) / Math.min(...dps)).toBeLessThan(2);
  });

  it('a tower shows its first augment color', () => {
    expect(towerColor(['frost', 'splash'].map((id) => copy(id)))).toBe(getAugment('frost').look.color);
    expect(towerColor([])).toBeUndefined();
  });
});

describe('splash cap', () => {
  it('counts the Splash copies in any slot, at any tier', () => {
    expect(spec('splash').splashCount).toBe(1);
    expect(spec('bolt', 'splash', 'splash').splashCount).toBe(2);
    expect(spec('splash', 'splash', 'splash').splashCount).toBe(3);
  });

  it('the tower line shows the cap: as a first, and added to a shot', () => {
    expect(describeSpec(spec('splash'))).toMatch(/Blasts the 3 furthest around it/);
    expect(describeSpec(spec('splash', 'splash'))).toMatch(/Blasts the 6 furthest/);
    expect(describeSpec(spec('bolt', 'splash'))).toMatch(/burst to 2 more/);
    expect(describeSpec(spec('bolt', 'splash', 'splash'))).toMatch(/burst to 5 more/);
  });

  it('Splash added to a Frost first only widens its reach, never caps it', () => {
    expect(spec('frost', 'splash').splash).toBe(0);
    expect(describeSpec(spec('frost', 'splash'))).toMatch(/Slows everything around it/);
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

describe('spray (Spray)', () => {
  it('a lone Spray blasts 5 pellets of 4 at the enemy furthest along, every 1.2 s, range 2.5', () => {
    expect(spec('spray')).toMatchObject({ kind: 'spray', damage: 4, range: 2.5, spray: 5, sprayCount: 1 });
    expect(spec('spray').rate).toBeCloseTo(1 / 1.2);
  });

  it('each added Spray adds two pellets per blast, and a Bolt adds one, in any slot', () => {
    expect(spec('spray', 'spray')).toMatchObject({ spray: 7, sprayCount: 2 });
    expect(spec('spray', 'spray', 'spray')).toMatchObject({ spray: 9, sprayCount: 3 });
    expect(spec('spray', 'bolt')).toMatchObject({ spray: 6 });
    expect(spec('spray', 'bolt', 'spray')).toMatchObject({ spray: 8, sprayCount: 2 });
  });

  it('a Spray added to a non-spray tower has no blast to grow: nothing changes', () => {
    expect(spec('bolt', 'spray')).toMatchObject({ kind: 'shot', spray: 0 });
  });

  it('rare and epic sprays deal 5 and 6 per pellet and fire faster', () => {
    expect(towerSpec([copy('spray', 'rare')]).damage).toBeCloseTo(5);
    expect(towerSpec([copy('spray', 'rare')]).rate).toBeCloseTo(1 / 1.05);
    expect(towerSpec([copy('spray', 'epic')]).damage).toBeCloseTo(6);
    expect(towerSpec([copy('spray', 'epic')]).rate).toBeCloseTo(1 / 0.9);
  });

  it('the per-target estimate counts every pellet of the blast up close', () => {
    expect(towerDps(spec('spray'))).toBeCloseTo(4 * 5 / 1.2);
    expect(towerDps(towerSpec([copy('spray', 'rare')]))).toBeCloseTo(5 * 5 / 1.05);
    expect(towerDps(towerSpec([copy('spray', 'epic')]))).toBeCloseTo(6 * 5 / 0.9);
  });

  it('the tower line says how many pellets the blast fires, and only for a spray', () => {
    expect(describeSpec(spec('spray'))).toMatch(/Blasts 5 pellets at the enemy furthest along/);
    expect(describeSpec(spec('spray', 'spray'))).toMatch(/Blasts 7 pellets/);
    expect(describeSpec(spec('bolt', 'spray'))).not.toMatch(/pellets/);
  });

  it('Lance, Splash, Rapid and Reach combine on a spray as on any tower', () => {
    expect(spec('spray', 'lance')).toMatchObject({ pierce: 1 });
    expect(describeSpec(spec('spray', 'lance'))).toMatch(/each pellet hits 2 in a line/);
    expect(spec('spray', 'splash')).toMatchObject({ splash: 1, splashCount: 1 });
    expect(spec('spray', 'rapid').rate).toBeCloseTo(spec('spray').rate * 1.5);
    expect(spec('spray', 'rapid').damage).toBeCloseTo(spec('spray').damage * 0.75);
    expect(spec('spray', 'reach').range).toBeCloseTo(spec('spray').range * 1.35);
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

describe('push (Push)', () => {
  it('a lone Push tower gusts everything within 2.5 cells back, without damage', () => {
    expect(spec('push')).toMatchObject({ kind: 'pulse', damage: 0, range: 2.5, gust: 0.8, pushCount: 1, pushPerHit: 0 });
    expect(spec('push').rate).toBeCloseTo(1 / 2.4);
  });

  it('the gust gets stronger and faster per tier', () => {
    expect(towerSpec([copy('push', 'rare')]).gust).toBe(1.0);
    expect(towerSpec([copy('push', 'rare')]).rate).toBeCloseTo(1 / 2.0);
    expect(towerSpec([copy('push', 'epic')]).gust).toBe(1.2);
    expect(towerSpec([copy('push', 'epic')]).rate).toBeCloseTo(1 / 1.8);
    expect(towerSpec([copy('push', 'epic')]).range).toBe(2.5);
    expect(towerSpec([copy('push', 'epic')]).damage).toBe(0);
  });

  it('a Push added to any tower pushes its hits back 0.4 cells; two stack; the first never adds per-hit', () => {
    expect(spec('bolt', 'push')).toMatchObject({ gust: 0, pushPerHit: 0.4, pushCount: 1 });
    expect(spec('bolt', 'push', 'push').pushPerHit).toBe(0.8);
    expect(spec('bolt', 'push', 'push').pushCount).toBe(2);
    expect(spec('push', 'push').gust).toBe(0.8);
    expect(spec('push', 'push').pushPerHit).toBe(0.4);
  });

  it('the tower line reads the gust and the per-hit push', () => {
    expect(describeSpec(spec('push'))).toMatch(/Pushes everything back 0\.8 cells/);
    expect(describeSpec(spec('bolt', 'push'))).toMatch(/hits push back 0\.4 cells/);
    expect(describeSpec(spec('bolt', 'push', 'push'))).toMatch(/hits push back 0\.8 cells/);
  });

  it("the card's tower line shows the tier's gust distance and cadence", () => {
    const p = getAugment('push');
    expect(tierTowerLine(p, 'rare')).toBe('Pushes everything back 1.0 cells, every 2.0 s.');
    expect(tierTowerLine(p, 'epic')).toBe('Pushes everything back 1.2 cells, every 1.8 s.');
    expect(tierTowerLine(p, 'common')).toBe(p.asTower);
  });
});

describe('beam (Beam)', () => {
  it('a Beam tower is a sustained line: no damage of its own, the beam deals it', () => {
    const s = spec('beam');
    expect(s).toMatchObject({ attacks: true, kind: 'beam', damage: 0, beamDps: 14, beamExtras: [] });
    expect(s.range).toBeCloseTo(3.5);
    expect(s.rate).toBe(1); // nominal: the beam never fires on a cooldown
    expect(beam.opening).toBe(true);
  });

  it('rare and epic beams deal 20 and 28 per second', () => {
    expect(towerSpec([copy('beam', 'rare')]).beamDps).toBe(20);
    expect(towerSpec([copy('beam', 'epic')]).beamDps).toBe(28);
  });

  it('a Beam added to any tower is a second line at half the rate; copies stack', () => {
    expect(spec('bolt', 'beam').beamExtras).toEqual([3]);
    expect(spec('bolt', 'beam', 'beam').beamExtras).toEqual([3, 3]);
  });

  it('a second Beam on a Beam tower adds a half-rate line', () => {
    expect(spec('beam', 'beam')).toMatchObject({ kind: 'beam', beamDps: 14, beamExtras: [3] });
  });

  it('a tiered added Beam uses the tier rate', () => {
    expect(towerSpec([copy('bolt'), copy('beam', 'rare')]).beamExtras).toEqual([4]);
    expect(towerSpec([copy('bolt'), copy('beam', 'epic')]).beamExtras).toEqual([5]);
  });

  it('the card shows the tier rate in both lines', () => {
    expect(tierTowerLine(beam, 'common')).toBe('Beams the furthest enemy: 14 per second, range 3.5.');
    expect(tierTowerLine(beam, 'rare')).toBe('Beams the furthest enemy: 20 per second, range 3.5.');
    expect(tierTowerLine(beam, 'epic')).toBe('Beams the furthest enemy: 28 per second, range 3.5.');
    expect(tierAddedLine(beam, 'common')).toBe('A second beam on the nearest enemy: 3 per second.');
    expect(tierAddedLine(beam, 'rare')).toBe('A second beam on the nearest enemy: 4 per second.');
    expect(tierAddedLine(beam, 'epic')).toBe('A second beam on the nearest enemy: 5 per second.');
  });

  it('the tower line says what it beams, and the second beam when one is added', () => {
    expect(describeSpec(spec('beam'))).toBe('Beams the furthest enemy: 14 per second.');
    expect(describeSpec(towerSpec([copy('beam', 'epic')]))).toBe('Beams the furthest enemy: 28 per second.');
    expect(describeSpec(spec('beam', 'beam'))).toContain('a second beam at 3 per second');
    expect(describeSpec(spec('beam', 'beam', 'beam'))).toContain('2 beams at 3 per second on the nearest enemies');
    expect(describeSpec(spec('bolt', 'beam'))).not.toContain('beam at');
  });

  it('a Bolt added to a beam adds a full-rate ray; a Rapid scales the beam by its net factor', () => {
    expect(spec('beam').beamRays).toBe(0);
    expect(spec('beam', 'bolt').beamRays).toBe(1);
    expect(spec('beam', 'bolt', 'bolt').beamRays).toBe(2);
    expect(spec('bolt', 'bolt').beamRays).toBe(0); // a Bolt on a non-beam tower is shots, not rays
    expect(spec('beam').beamRapidMul).toBe(1);
    expect(spec('beam', 'rapid').beamRapidMul).toBeCloseTo(1.125); // 1.5 x 0.75, its own accumulator
  });

  it('the tower line says how many enemies it beams when a ray is added', () => {
    expect(describeSpec(spec('beam', 'bolt'))).toBe('Beams 2 enemies: 14 per second each.');
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

describe('draftCardCount', () => {
  it('offers four cards on every fifth draft, three on the rest', () => {
    for (let d = 1; d <= 25; d++) expect(draftCardCount(d)).toBe(d % 5 === 0 ? 4 : 3);
  });

  it('a four-card draft rolls four different augments', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const offer = rollOffer(new Rng(seed), AUGMENTS, 4, 5);
      expect(offer).toHaveLength(4);
      expect(new Set(offer.map((c) => c.id)).size).toBe(4);
    }
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

  it('the opening draft always offers a Common Bolt', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const offer = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true);
      expect(offer.length).toBe(3);
      expect(new Set(offer.map((a) => a.id)).size).toBe(3);
      expect(offer.some((c) => c.id === 'bolt' && c.tier === 'common')).toBe(true);
    }
  });

  it('the next draft never offers an augment the last one did', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let last: string[] = [];
      for (let i = 0; i < 12; i++) {
        const offer = rollOffer(rng, AUGMENTS, 3, i + 1, i === 0, last);
        for (const c of offer) expect(last.includes(c.id)).toBe(false);
        last = offer.map((c) => c.id);
      }
    }
  });

  it('a reroll offers nothing from the offer it replaces (the opening reroll drops the bolt)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const first = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true);
      const rerolled = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true, first.map((c) => c.id));
      expect(rerolled.length).toBe(3);
      expect(new Set(rerolled.map((c) => c.id)).size).toBe(3);
      for (const c of rerolled) expect(first.some((f) => f.id === c.id)).toBe(false);
    }
  });

  it('the rule relaxes, rather than hard-failing, when exclusions leave fewer than 3 eligible', () => {
    const tiny = AUGMENTS.slice(0, 4); // bolt, lance, splash, frost
    for (let seed = 1; seed <= 50; seed++) expect(rollOffer(new Rng(seed), tiny, 3, 5, false, ['bolt', 'lance'])).toHaveLength(3);
  });

  it('no Bolt promise after wave 1: some later draft rolls no Bolt at all', () => {
    let noBolt = 0;
    for (let seed = 1; seed <= 200; seed++) if (!rollOffer(new Rng(seed), AUGMENTS, 3, 2).some((c) => c.id === 'bolt')) noBolt += 1;
    expect(noBolt).toBeGreaterThan(0);
  });
});
