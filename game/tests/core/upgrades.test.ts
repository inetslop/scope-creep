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
    const maxed = ['contrast', 'vector', 'draft'];
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

  it('every plain upgrade offers exactly maxLevel levels, then stops', () => {
    const plain = UPGRADES.filter((d) => !d.requires && !d.requiresWeapon && !d.grantsWeapon);
    expect(plain.length).toBeGreaterThan(0);
    for (const def of plain) {
      const run = new RunState(1);
      for (let i = 0; i < def.maxLevel; i++) {
        expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
        run.applyUpgrade(def);
      }
      expect(run.upgradeLevel(def.id)).toBe(def.maxLevel);
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
    }
  });
});
