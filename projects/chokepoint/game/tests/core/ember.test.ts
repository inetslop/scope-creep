import { describe, expect, it } from 'vitest';
import { AUGMENTS } from '../../src/content/augments';
import { ember } from '../../src/content/augments/ember';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, rollOffer, towerSpec } from '../../src/core/augments';
import { burnRate, burnStep, ignite } from '../../src/core/burn';
import type { LiveBurn } from '../../src/core/burn';
import { Rng } from '../../src/core/rng';
import { tierAdded, tierAddedLine, tierFirst, tierTowerLine } from '../../src/core/tiers';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('ember', () => {
  it('an Ember tower is a burn attack: no damage of its own, the burn does it', () => {
    const s = spec('ember');
    expect(s).toMatchObject({ attacks: true, kind: 'burn', damage: 0, burn: { dps: 3, sec: 3 }, burnCount: 1 });
    expect(s.range).toBeCloseTo(2.6);
    expect(s.rate).toBeCloseTo(1 / 1.5);
  });

  it('the burn ticks its rate over its life: about 9, 12 and 15 for Common, Rare and Epic', () => {
    for (const [tier, total] of [['common', 9], ['rare', 12], ['epic', 15]] as const) {
      const b = tierFirst(ember, tier).burn!;
      const live: LiveBurn = { dps: b.dps, mul: 1, acc: 0, left: b.sec };
      let dealt = 0;
      let ticks = 0;
      for (let i = 0; i < 12; i++) for (const d of burnStep(live, 0.25)) { dealt += d; ticks += 1; }
      expect(ticks).toBe(12); // one tick per 0.25 s of the 3 s ablaze
      expect(dealt).toBeCloseTo(total);
      expect(live.left).toBe(0);
    }
  });

  it('re-ignition refreshes the duration and keeps the hotter burn; it never adds up', () => {
    const live: LiveBurn = { dps: 0, mul: 1, acc: 0, left: 0 };
    expect(ignite(live, 3, 3, 1)).toBe(true); // the first ablaze
    expect(ignite(live, 3, 3, 1)).toBe(false); // a Common over a Common: a silent refresh
    expect(live).toEqual({ dps: 3, mul: 1, acc: 0, left: 3 });
    expect(ignite(live, 4, 3, 1)).toBe(false); // a Rare over a Common burns at 4/s
    expect(live.dps).toBe(4);
    expect(ignite(live, 3, 3, 1)).toBe(false); // a Common over a Rare: still 4/s, never 6
    expect(live).toEqual({ dps: 4, mul: 1, acc: 0, left: 3 });
    let dealt = 0;
    for (let i = 0; i < 12; i++) for (const d of burnStep(live, 0.25)) dealt += d;
    expect(dealt).toBeCloseTo(12);
    // A fresh ablaze after the burn has spent starts at the igniter's rate, not the spent one's.
    expect(ignite(live, 3, 3, 1)).toBe(true); // a Common re-ignites the enemy after its burn ran out
    expect(live).toEqual({ dps: 3, mul: 1, acc: 0, left: 3 });
  });

  it('a burn burns at its igniter\'s rate times the burning tower\'s damage multiplier', () => {
    const live: LiveBurn = { dps: 0, mul: 1, acc: 0, left: 0 };
    expect(ignite(live, 3, 3, 0.75)).toBe(true); // a Rapid-added tower: the lighter hits burn lighter
    expect(burnRate(live)).toBeCloseTo(2.25);
    let dealt = 0;
    for (let i = 0; i < 12; i++) for (const d of burnStep(live, 0.25)) dealt += d;
    expect(dealt).toBeCloseTo(6.75); // 12 ticks of 2.25 / 4
    expect(live.left).toBe(0);
  });

  it('overtaking compares the effective rate (rate times the burning tower\'s multiplier)', () => {
    const live: LiveBurn = { dps: 0, mul: 1, acc: 0, left: 0 };
    ignite(live, 3, 3, 1.25); // burning at 3.75/s
    expect(ignite(live, 4, 3, 1)).toBe(false); // 4/s x 1 = 4 beats 3/s x 1.25 = 3.75
    expect(live).toMatchObject({ dps: 4, mul: 1 });
    expect(ignite(live, 4, 3, 1.5)).toBe(false); // 4/s x 1.5 = 6 beats 4/s x 1
    expect(live).toMatchObject({ dps: 4, mul: 1.5 });
    expect(ignite(live, 5, 3, 1)).toBe(false); // 5/s x 1 = 5 loses to 6/s
    expect(live).toMatchObject({ dps: 4, mul: 1.5 });
    expect(burnRate(live)).toBeCloseTo(6);
  });

  it('the tower\'s damage multiplier scales its burn: Rapid adds 0.75, a Rare tier adds its own', () => {
    expect(towerSpec([copy('ember'), copy('rapid')]).damageMul).toBeCloseTo(0.75);
    expect(describeSpec(towerSpec([copy('ember'), copy('rapid')]))).toContain('2.25 per second');
    expect(towerSpec([copy('bolt', 'rare')]).damageMul).toBeCloseTo(1.3);
    expect(towerSpec([copy('ember', 'rare'), copy('rapid')]).damageMul).toBeCloseTo(0.75); // the burn's own rate, not its multiplier
  });

  it('rare and epic Embers burn at 4 and 5 per second, first and added', () => {
    expect(tierFirst(ember, 'rare').burn).toEqual({ dps: 4, sec: 3 });
    expect(tierFirst(ember, 'epic').burn).toEqual({ dps: 5, sec: 3 });
    expect(tierAdded(ember, 'rare').burn).toEqual({ dps: 4, sec: 3 });
    expect(tierAdded(ember, 'epic').burn).toEqual({ dps: 5, sec: 3 });
    expect(towerSpec([copy('ember', 'rare')]).burn).toEqual({ dps: 4, sec: 3 });
    expect(towerSpec([copy('bolt'), copy('ember', 'epic')]).burn).toEqual({ dps: 5, sec: 3 });
  });

  it('a tower with several Embers burns at the strongest one; the rates never add up', () => {
    expect(spec('bolt', 'ember', 'ember')).toMatchObject({ kind: 'shot', burn: { dps: 3, sec: 3 }, burnCount: 2 });
    expect(towerSpec([copy('ember'), copy('ember', 'rare')]).burn).toEqual({ dps: 4, sec: 3 });
    expect(towerSpec([copy('ember', 'rare'), copy('ember')]).burn).toEqual({ dps: 4, sec: 3 });
  });

  it('a Bolt with Ember in a later slot keeps shooting and its hits set ablaze', () => {
    const s = spec('bolt', 'ember');
    expect(s).toMatchObject({ kind: 'shot', damage: 12, burn: { dps: 3, sec: 3 }, burnCount: 1 });
    expect(s.rate).toBeCloseTo(1.6);
  });

  it('the card shows the tier rate in both lines', () => {
    expect(tierTowerLine(ember, 'common')).toBe('Sets ablaze the furthest enemy: 3 per second for 3 s.');
    expect(tierTowerLine(ember, 'rare')).toBe('Sets ablaze the furthest enemy: 4 per second for 3 s.');
    expect(tierTowerLine(ember, 'epic')).toBe('Sets ablaze the furthest enemy: 5 per second for 3 s.');
    expect(tierAddedLine(ember, 'common')).toBe('Hits set ablaze: 3 per second for 3 s.');
    expect(tierAddedLine(ember, 'rare')).toBe('Hits set ablaze: 4 per second for 3 s.');
    expect(tierAddedLine(ember, 'epic')).toBe('Hits set ablaze: 5 per second for 3 s.');
  });

  it('the tower panel says what it burns, and its hits set ablaze on any other first', () => {
    expect(describeSpec(spec('ember'))).toBe('Sets ablaze the furthest enemy: 3 per second for 3 s.');
    expect(describeSpec(towerSpec([copy('ember', 'rare')]))).toBe('Sets ablaze the furthest enemy: 4 per second for 3 s.');
    expect(describeSpec(spec('bolt', 'ember'))).toContain(', and its hits set ablaze');
    expect(describeSpec(spec('frost', 'ember'))).toContain(', and its hits set ablaze');
    expect(describeSpec(spec('mark', 'ember'))).toContain(', and its hits set ablaze');
    expect(describeSpec(spec('ember', 'frost'))).toContain('slowing them by 40%');
    expect(describeSpec(spec('bolt'))).not.toContain('ablaze');
  });

  it('rolls at every tier and may open a run', () => {
    expect(ember.tier).toBeUndefined();
    expect(ember.opening).toBe(true);
    const seen = new Set<Tier>();
    for (let seed = 1; seed <= 500; seed++)
      for (const c of rollOffer(new Rng(seed), AUGMENTS, 3, 10))
        if (c.id === 'ember') seen.add(c.tier);
    expect(seen).toEqual(new Set(['common', 'rare', 'epic']));
  });

  it('the opening draft can offer an Ember', () => {
    let offered = 0;
    for (let seed = 1; seed <= 300; seed++)
      if (rollOffer(new Rng(seed), AUGMENTS, 3, 1, true).some((c) => c.id === 'ember')) offered += 1;
    expect(offered).toBeGreaterThan(0);
  });
});
