import { describe, expect, it } from 'vitest';
import { RunState } from '../../src/core/run';

function kills(n: number, run: RunState): void {
  for (let i = 0; i < n; i++) run.registerKill();
}

describe('kill-streak tally', () => {
  it('a fresh run reads 0 for streak and bestStreak', () => {
    const run = new RunState(1);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(0);
  });

  it('eight consecutive kills grow streak and bestStreak to 8', () => {
    const run = new RunState(1);
    kills(8, run);
    expect(run.streak).toBe(8);
    expect(run.bestStreak).toBe(8);
  });

  it('taking damage resets streak but keeps bestStreak', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(8);
  });

  it('a shorter run after a reset leaves bestStreak at 8', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    kills(5, run);
    expect(run.streak).toBe(5);
    expect(run.bestStreak).toBe(8);
  });

  it('a longer run after a reset raises bestStreak to 9', () => {
    const run = new RunState(1);
    kills(8, run);
    run.takeDamage(1);
    kills(9, run);
    expect(run.streak).toBe(9);
    expect(run.bestStreak).toBe(9);
  });
});
