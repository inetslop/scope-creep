import { describe, expect, it } from 'vitest';
import { UPGRADES, UPGRADE_BY_ID } from '../../src/content/upgrades';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { isUpgradeAvailable, rollUpgradeChoices } from '../../src/core/upgrades';

describe('rollUpgradeChoices', () => {
  it('returns exactly 3 distinct upgrades when 3+ are available', () => {
    const run = new RunState(1);
    for (let seed = 1; seed < 50; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((c) => c.id)).size).toBe(3);
    }
  });

  it('never offers an upgrade at max level', () => {
    const run = new RunState(1);
    const maxed = ['contrast', 'vector', 'plate'];
    for (const id of maxed) {
      const def = UPGRADE_BY_ID.get(id)!;
      for (let i = 0; i < def.maxLevel; i++) run.applyUpgrade(def);
    }
    for (let seed = 1; seed < 200; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      for (const id of maxed) expect(choices.map((c) => c.id)).not.toContain(id);
    }
  });

  it('presto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('presto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('presto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('pulse offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pulse')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pulse')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('sweep offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('sweep')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
      { stat: 'pickupRadius', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('sweep')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('trill offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('trill')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('trill')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('tessitura offers 5 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('tessitura')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'maxHp', op: 'add', value: 10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('tessitura')).toBe(5);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
});
