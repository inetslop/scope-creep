import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';
import { isUpgradeAvailable } from '../../src/core/upgrades';

const def = (id: string) => UPGRADE_BY_ID.get(id)!;

describe('removeLastUpgrade (the Eraser)', () => {
  it('returns null when the player has no upgrades', () => {
    const run = new RunState(1);
    expect(run.removeLastUpgrade()).toBeNull();
    expect(run.upgradeHistory).toEqual([]);
  });

  it('removes the most recent level and recomputes stats', () => {
    const run = new RunState(1);
    run.applyUpgrade(def('rhythm'));
    run.applyUpgrade(def('weight'));
    expect(run.stats.damageMul).toBeCloseTo(1.25);
    const removed = run.removeLastUpgrade();
    expect(removed?.id).toBe('weight');
    expect(run.upgradeLevel('weight')).toBe(0);
    expect(run.upgradeLevel('rhythm')).toBe(1);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBeCloseTo(1.2);
    expect(run.upgradeHistory).toEqual(['rhythm']);
  });

  it('drops one of two levels of the same upgrade', () => {
    const run = new RunState(1);
    run.applyUpgrade(def('rhythm'));
    run.applyUpgrade(def('rhythm'));
    expect(run.upgradeLevel('rhythm')).toBe(2);
    expect(run.stats.fireRateMul).toBeCloseTo(1.44);
    const removed = run.removeLastUpgrade();
    expect(removed?.id).toBe('rhythm');
    expect(run.upgradeLevel('rhythm')).toBe(1);
    expect(run.stats.fireRateMul).toBeCloseTo(1.2);
  });

  it('removes a granted weapon, leaving point', () => {
    const run = new RunState(1);
    run.applyUpgrade(def('line'));
    expect(run.weapons).toEqual(['point', 'line']);
    const removed = run.removeLastUpgrade();
    expect(removed?.id).toBe('line');
    expect(run.weapons).toEqual(['point']);
    expect(run.upgradeLevel('line')).toBe(0);
  });

  it('clamps hp to the reduced max after erasing mass', () => {
    const run = new RunState(1);
    run.applyUpgrade(def('mass'));
    expect(run.stats.maxHp).toBe(125);
    expect(run.hp).toBe(125);
    run.removeLastUpgrade();
    expect(run.stats.maxHp).toBe(100);
    expect(run.hp).toBe(100);
  });

  it('makes the erased upgrade offerable again at the next level-up', () => {
    const run = new RunState(1);
    const line = def('line');
    run.applyUpgrade(line);
    expect(isUpgradeAvailable(line, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
    run.removeLastUpgrade();
    expect(isUpgradeAvailable(line, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
  });
});
