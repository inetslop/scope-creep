import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { isFlyerBossPlan } from '../../src/core/flyTelegraph';
import { planWave } from '../../src/core/waves';

const plan = (wave: number) => planWave(wave, new Rng(wave), ENEMIES);

describe('isFlyerBossPlan', () => {
  it('is true for the wave-50 plan (the Flyer boss wave)', () => {
    expect(isFlyerBossPlan(plan(50))).toBe(true);
  });

  it('is false for the wave-49 and wave-51 plans', () => {
    expect(isFlyerBossPlan(plan(49))).toBe(false);
    expect(isFlyerBossPlan(plan(51))).toBe(false);
  });

  it('is false with no plan (a resume mid-wave has no next plan)', () => {
    expect(isFlyerBossPlan(undefined)).toBe(false);
  });

  it('is false for the other boss plans (10 the Colossus, 20 the Guard and Titan, 30 the Orb)', () => {
    expect(isFlyerBossPlan(plan(10))).toBe(false);
    expect(isFlyerBossPlan(plan(20))).toBe(false);
    expect(isFlyerBossPlan(plan(30))).toBe(false);
  });

  it('no wave plan but the wave-50 one declares the Flyer boss (waves 1-60)', () => {
    for (let wave = 1; wave <= 60; wave++) {
      if (wave === 50) continue;
      expect(isFlyerBossPlan(plan(wave))).toBe(false);
    }
  });
});
