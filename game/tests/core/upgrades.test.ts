import { describe, expect, it } from 'vitest';
import { UPGRADES, UPGRADE_BY_ID } from '../../src/content/upgrades';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { rollUpgradeChoices } from '../../src/core/upgrades';

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
});
