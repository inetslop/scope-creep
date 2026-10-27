import { describe, expect, it } from 'vitest';
import { UPGRADES, UPGRADE_BY_ID } from '../../src/content/upgrades';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { drawWarmStartPick, isWarmStartEarned, WARM_START_TIME_SEC } from '../../src/core/warmStart';

describe('isWarmStartEarned', () => {
  it('arms at exactly 480 s and not a hair before', () => {
    expect(WARM_START_TIME_SEC).toBe(480);
    expect(isWarmStartEarned(0)).toBe(false);
    expect(isWarmStartEarned(479.999)).toBe(false);
    expect(isWarmStartEarned(480)).toBe(true);
    expect(isWarmStartEarned(600)).toBe(true);
  });
});

describe('drawWarmStartPick', () => {
  it('is reproducible for a fixed seed', () => {
    const run = new RunState(1);
    const pickOf = (rng: Rng) => drawWarmStartPick(rng, UPGRADES, (id) => run.upgradeLevel(id), run.weapons).id;
    expect(pickOf(new Rng(7))).toBe(pickOf(new Rng(7)));
  });

  it('never offers a maxed card', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('rhythm')!;
    for (let i = 0; i < def.maxLevel; i++) run.applyUpgrade(def);
    for (let seed = 1; seed < 200; seed++) {
      const pick = drawWarmStartPick(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons);
      expect(pick.id).not.toBe('rhythm');
    }
  });

  it('can offer any of the pool cards, weapon cards included', () => {
    const run = new RunState(1);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 4000 && seen.size < UPGRADES.length; seed++) {
      seen.add(drawWarmStartPick(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons).id);
    }
    expect(seen.size).toBe(UPGRADES.length);
  });
});
