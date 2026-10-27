import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';

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

  it('weight + emphasis stack as 1.25 * 1.15', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('emphasis'));
    expect(run.stats.damageMul).toBe(1.4375);
  });

  it('rhythm + allegro stack as 1.2 * 1.15', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('rhythm'));
    run.applyUpgrade(byId('allegro'));
    expect(run.stats.fireRateMul).toBe(1.38);
  });

  it('damage-only upgrades leave fire rate and move speed at base', () => {
    const run = new RunState(1);
    run.applyUpgrade(byId('weight'));
    run.applyUpgrade(byId('emphasis'));
    expect(run.stats.fireRateMul).toBe(1);
    expect(run.stats.moveSpeed).toBe(230);
  });
});
