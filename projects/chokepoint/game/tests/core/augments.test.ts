import { describe, expect, it } from 'vitest';
import { MAX_SLOTS } from '../../src/config';
import { AUGMENTS, getAugment } from '../../src/content/augments';
import { describeSpec, rollOffer, slotCost, towerColor, towerSpec } from '../../src/core/augments';
import { Rng } from '../../src/core/rng';

const spec = (...ids: string[]) => towerSpec(ids.map(getAugment));

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
    expect(towerColor(['frost', 'splash'].map(getAugment))).toBe(getAugment('frost').look.color);
    expect(towerColor([])).toBeUndefined();
  });
});

describe('slotCost', () => {
  it('gets much more expensive per slot, up to the max', () => {
    for (let i = 1; i < MAX_SLOTS; i++) expect(slotCost(i)!).toBeGreaterThan(slotCost(i - 1)! * 1.5);
    expect(slotCost(MAX_SLOTS)).toBeUndefined();
  });
});

describe('rollOffer', () => {
  it('the opening draft only offers augments that deal damage', () => {
    for (let seed = 1; seed <= 30; seed++) expect(rollOffer(new Rng(seed), AUGMENTS, 3, true).every((a) => a.first.damage > 0)).toBe(true);
  });

  it('offers three different augments', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const offer = rollOffer(new Rng(seed), AUGMENTS, 3);
      expect(offer.length).toBe(3);
      expect(new Set(offer.map((a) => a.id)).size).toBe(3);
    }
  });
});
