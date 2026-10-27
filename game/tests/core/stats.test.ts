import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';
import { fireRateMultiplier, streakFireBonus } from '../../src/core/stats';

describe('stat stacking', () => {
  const byId = (id: string) => UPGRADE_BY_ID.get(id)!;

  it('a fresh run reads the base values before any upgrade', () => {
    const run = new RunState(1);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
    expect(run.stats.moveSpeed).toBe(230);
  });

  it('weight x3 stacks as 1.25 * 1.25 * 1.25', () => {
    const run = new RunState(1);
    const def = byId('weight');
    for (let i = 0; i < 3; i++) run.applyUpgrade(def);
    expect(run.stats.damageMul).toBe(1.953125);
  });

  it('rhythm x2 stacks as 1.2 * 1.2', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('rhythm'));
    run.applyUpgrade(byId('rhythm'));
    expect(run.stats.fireRateMul).toBeCloseTo(1.44, 12);
  });

  it('damage-only upgrades leave fire rate and move speed at base', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('weight'));
    expect(run.stats.fireRateMul).toBe(1);
    expect(run.stats.moveSpeed).toBe(230);
  });
});

describe('streak fire bonus (Crescendo)', () => {
  it('is 1 below the threshold and 1.1 at 8 and above', () => {
    expect(streakFireBonus(7)).toBe(1);
    expect(streakFireBonus(8)).toBe(1.1);
    expect(streakFireBonus(16)).toBe(1.1);
  });

  it('multiplies on top of fire-rate upgrades, not a flat add', () => {
    const run = new RunState(1);
    for (let i = 0; i < 5; i++) run.applyUpgrade(UPGRADE_BY_ID.get('rhythm')!);
    expect(fireRateMultiplier(run.stats, 7)).toBeCloseTo(1.2 ** 5, 12);
    expect(fireRateMultiplier(run.stats, 8)).toBeCloseTo(1.2 ** 5 * 1.1, 12);
  });

  it('drops to 1 the moment damage resets the streak', () => {
    const run = new RunState(1);
    for (let i = 0; i < 8; i++) run.registerKill();
    expect(streakFireBonus(run.streak)).toBe(1.1);
    run.takeDamage(1);
    expect(streakFireBonus(run.streak)).toBe(1);
  });
});
