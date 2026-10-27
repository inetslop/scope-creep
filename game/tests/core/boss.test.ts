import { describe, expect, it } from 'vitest';
import { BOSS_SCHEDULE, BossTimer, bossForKill, bossHpMultiplier } from '../../src/core/boss';

describe('BossTimer', () => {
  it('first boss is due at exactly 300 s', () => {
    expect(BOSS_SCHEDULE).toEqual({ firstAtSec: 300, intervalSec: 300 });
    const timer = new BossTimer();
    expect(timer.due(299.9, false)).toBe(false);
    expect(timer.due(300, false)).toBe(true);
    expect(timer.due(300.1, false)).toBe(true);
  });

  it('is never due while a boss is alive', () => {
    const timer = new BossTimer();
    expect(timer.due(300, true)).toBe(false);
    expect(timer.due(1000, true)).toBe(false);
  });

  it('is due 300 s after each kill (300 -> 600 -> 900)', () => {
    const timer = new BossTimer();
    expect(timer.due(300, false)).toBe(true);
    timer.onBossKilled(300);
    expect(timer.due(599.9, false)).toBe(false);
    expect(timer.due(600, false)).toBe(true);
    timer.onBossKilled(600);
    expect(timer.due(899.9, false)).toBe(false);
    expect(timer.due(900, false)).toBe(true);
  });

  it('supports a custom schedule', () => {
    const timer = new BossTimer({ firstAtSec: 10, intervalSec: 20 });
    expect(timer.due(9.9, false)).toBe(false);
    expect(timer.due(10, false)).toBe(true);
    timer.onBossKilled(10);
    expect(timer.due(29.9, false)).toBe(false);
    expect(timer.due(30, false)).toBe(true);
  });
});

describe('bossHpMultiplier', () => {
  it('scales 1.5x per kill: 1200 -> 1800 -> 2700', () => {
    expect(bossHpMultiplier(0)).toBe(1);
    expect(bossHpMultiplier(1)).toBeCloseTo(1.5);
    expect(bossHpMultiplier(2)).toBeCloseTo(2.25);
    expect(Math.round(1200 * bossHpMultiplier(0))).toBe(1200);
    expect(Math.round(1200 * bossHpMultiplier(1))).toBe(1800);
    expect(Math.round(1200 * bossHpMultiplier(2))).toBe(2700);
  });
});

describe('bossForKill', () => {
  it('alternates Frame / Grid / Frame / Grid as bosses die', () => {
    expect(bossForKill(0).id).toBe('frame');
    expect(bossForKill(1).id).toBe('grid');
    expect(bossForKill(2).id).toBe('frame');
    expect(bossForKill(3).id).toBe('grid');
  });
});

describe('boss alternation: the Nth boss of the run (1-based)', () => {
  it('boss #1 (The Frame, 5:00 spawn) is always The Frame, never The Grid', () => {
    expect(bossForKill(0).id).toBe('frame');
    expect(bossForKill(0).id).not.toBe('grid');
  });

  it('strict alternation: #1..#5 = frame, grid, frame, grid, frame', () => {
    // Boss #N of the run is bossForKill(N - 1); BossSystem passes run.bossKills.
    const ids = [1, 2, 3, 4, 5].map((n) => bossForKill(n - 1).id);
    expect(ids).toEqual(['frame', 'grid', 'frame', 'grid', 'frame']);
  });

  it('deterministic: no RNG, the same boss number always returns the same boss', () => {
    const seq = () => [0, 1, 2, 3, 4].map((k) => bossForKill(k).id);
    expect(seq()).toEqual(seq());
  });
});
