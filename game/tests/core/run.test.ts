import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';

describe('upgrade removal (the Eraser)', () => {
  const byId = (id: string) => UPGRADE_BY_ID.get(id)!;
  const pick3 = (run: RunState) => {
    run.applyUpgrade(byId('rhythm'));
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('weight'));
  };

  it('is a no-op on a fresh run with no upgrades', () => {
    const run = new RunState(1);
    expect(run.removeLastUpgrade()).toBeNull();
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });

  it('drops the newest level first: weight 2 -> 1, rhythm stays at 1', () => {
    const run = new RunState(1);
    pick3(run);
    expect(run.removeLastUpgrade()?.id).toBe('weight');
    expect(run.upgradeLevel('rhythm')).toBe(1);
    expect(run.upgradeLevel('weight')).toBe(1);
  });

  it('drops weight to 0: damage back at base, fire rate keeps rhythm', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()?.id).toBe('weight');
    expect(run.upgradeLevel('weight')).toBe(0);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1.2);
  });

  it('drops rhythm to 0: all stats back at base', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()?.id).toBe('rhythm');
    expect(run.upgradeLevel('rhythm')).toBe(0);
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });

  it('is a no-op again on the now-empty run', () => {
    const run = new RunState(1);
    pick3(run);
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    run.removeLastUpgrade();
    expect(run.removeLastUpgrade()).toBeNull();
    expect(run.stats.damageMul).toBe(1);
    expect(run.stats.fireRateMul).toBe(1);
  });
});
