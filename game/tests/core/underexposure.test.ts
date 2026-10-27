import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';
import { BASE_STATS, computeStats } from '../../src/core/stats';
import { underexposureDamage, WOUND_MULTIPLIER } from '../../src/core/underexposure';

describe('underexposure rule', () => {
  it('leaves every hit alone without the card', () => {
    expect(BASE_STATS.woundThreshold).toBe(0);
    expect(new RunState(1).stats.woundThreshold).toBe(0);
    expect(underexposureDamage(0, 40, 100, 10)).toEqual({ damage: 10, doubled: false });
  });

  it('doubles only below 50% of max HP at level 1', () => {
    expect(underexposureDamage(0.5, 49, 100, 10)).toEqual({ damage: 20, doubled: true });
    expect(underexposureDamage(0.5, 50, 100, 10)).toEqual({ damage: 10, doubled: false });
    expect(underexposureDamage(0.5, 51, 100, 10)).toEqual({ damage: 10, doubled: false });
  });

  it('widens to 75% of max HP at level 2', () => {
    expect(underexposureDamage(0.75, 74, 100, 10)).toEqual({ damage: 20, doubled: true });
    expect(underexposureDamage(0.75, 75, 100, 10)).toEqual({ damage: 10, doubled: false });
    expect(underexposureDamage(0.75, 76, 100, 10)).toEqual({ damage: 10, doubled: false });
  });

  it('measures against the target\'s own max HP', () => {
    expect(underexposureDamage(0.5, 9, 20, 10)).toEqual({ damage: 20, doubled: true });
    expect(underexposureDamage(0.5, 10, 20, 10)).toEqual({ damage: 10, doubled: false });
  });

  it('multiplies the hit, not a flat bonus', () => {
    expect(WOUND_MULTIPLIER).toBe(2);
    expect(underexposureDamage(0.5, 1, 100, 13.5)).toEqual({ damage: 27, doubled: true });
  });

  it('the upgrade feeds woundThreshold, clamped at 0.75', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('underexposure')!;
    run.applyUpgrade(def);
    expect(run.stats.woundThreshold).toBe(0.5);
    run.applyUpgrade(def);
    expect(run.stats.woundThreshold).toBe(0.75);
    expect(computeStats([{ stat: 'woundThreshold', op: 'add', value: 99 }]).woundThreshold).toBe(0.75);
  });
});
