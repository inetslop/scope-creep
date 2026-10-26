import { describe, expect, it } from 'vitest';
import { UPGRADE_BY_ID } from '../../src/content/upgrades';
import { RunState } from '../../src/core/run';
import { BASE_STATS, computeStats } from '../../src/core/stats';

describe('critChance clamping', () => {
  it('a fresh run reads 0', () => {
    expect(BASE_STATS.critChance).toBe(0);
    expect(new RunState(1).stats.critChance).toBe(0);
  });

  it('never reads above 0.5', () => {
    expect(computeStats([{ stat: 'critChance', op: 'add', value: 99 }]).critChance).toBe(0.5);
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('contrast')!;
    for (let i = 0; i < 10; i++) run.applyUpgrade(def);
    expect(run.stats.critChance).toBe(0.5);
  });

  it('never reads below 0', () => {
    expect(computeStats([{ stat: 'critChance', op: 'add', value: -99 }]).critChance).toBe(0);
    const s = computeStats([
      { stat: 'critChance', op: 'add', value: 0.2 },
      { stat: 'critChance', op: 'add', value: -1 },
    ]);
    expect(s.critChance).toBe(0);
  });
});
