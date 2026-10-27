import { describe, expect, it } from 'vitest';
import { xpToNextLevel } from '../../src/core/progression';
import { RunState } from '../../src/core/run';

describe('xpToNextLevel', () => {
  it('matches the pinned values for the first levels', () => {
    expect(xpToNextLevel(1)).toBe(9);
    expect(xpToNextLevel(2)).toBe(16);
  });

  it('is strictly increasing from level 1 through level 30', () => {
    for (let level = 2; level <= 30; level++) {
      expect(xpToNextLevel(level)).toBeGreaterThan(xpToNextLevel(level - 1));
    }
  });

  it('stays finite at high levels', () => {
    const xp = xpToNextLevel(100);
    expect(Number.isFinite(xp)).toBe(true);
    expect(xp).toBe(3182);
  });
});

describe('RunState XP', () => {
  it('a fresh run starts at level 1 with 0 XP', () => {
    const run = new RunState(1);
    expect(run.level).toBe(1);
    expect(run.xp).toBe(0);
    expect(run.xpToNext).toBe(xpToNextLevel(1));
  });

  it('adding exactly the required XP levels up exactly once', () => {
    const run = new RunState(1);
    const gained = run.addXp(xpToNextLevel(1));
    expect(gained).toBe(1);
    expect(run.level).toBe(2);
    expect(run.xp).toBe(0);
    expect(run.xpToNext).toBe(xpToNextLevel(2));
    expect(run.pendingLevelUps).toBe(1);
  });

  it('adding one less XP does not level up', () => {
    const run = new RunState(1);
    const gained = run.addXp(xpToNextLevel(1) - 1);
    expect(gained).toBe(0);
    expect(run.level).toBe(1);
    expect(run.xp).toBe(xpToNextLevel(1) - 1);
    expect(run.pendingLevelUps).toBe(0);
  });
});
