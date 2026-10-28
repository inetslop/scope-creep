import { describe, expect, it } from 'vitest';
import { REROLL_COST, START } from '../../src/config';
import { PALETTE } from '../../src/content/palette';
import { RunState } from '../../src/core/run';

describe('RunState', () => {
  it('starts with the starting gold and lives, in the build phase', () => {
    const run = new RunState(1);
    expect(run.gold).toBe(START.gold);
    expect(run.lives).toBe(START.lives);
    expect(run.phase).toBe('build');
  });

  it('only spends gold it has', () => {
    const run = new RunState(1);
    expect(run.spend(START.gold + 1)).toBe(false);
    expect(run.gold).toBe(START.gold);
    expect(run.spend(30)).toBe(true);
    expect(run.gold).toBe(START.gold - 30);
  });

  it('pays kills', () => {
    const run = new RunState(1);
    expect(run.addKill(4)).toBe(4);
    expect(run.gold).toBe(START.gold + 4);
    expect(run.kills).toBe(1);
  });

  it("remembers the run's longest kill chain", () => {
    const run = new RunState(1);
    run.noteCombo(1);
    run.noteCombo(3);
    run.noteCombo(2);
    run.noteCombo(5);
    run.noteCombo(4);
    expect(run.bestCombo).toBe(5);
  });

  it('starts with the starting hand; picks go in, placing takes them out', () => {
    const run = new RunState(1);
    expect(run.hand).toEqual([...START.hand]);
    run.takeAugment({ id: 'frost', tier: 'common' });
    run.takeAugment({ id: 'bolt', tier: 'rare' });
    expect(run.useAugment(0)).toEqual({ id: 'frost', tier: 'common' });
    expect(run.hand).toEqual([{ id: 'bolt', tier: 'rare' }]);
    expect(run.useAugment(5)).toBeUndefined();
  });

  it('ends the run when the lives run out, never below zero', () => {
    const run = new RunState(1);
    run.startWave();
    expect(run.leak(START.lives - 1)).toBe(false);
    expect(run.leak(5)).toBe(true);
    expect(run.lives).toBe(0);
    expect(run.phase).toBe('over');
  });

  it('counts cleared waves for the score', () => {
    const run = new RunState(1);
    run.startWave();
    expect(run.wavesCleared).toBe(0);
    run.clearWave();
    expect(run.wavesCleared).toBe(1);
    expect(run.phase).toBe('draft');
    run.startBuild(5);
    run.startWave();
    expect(run.wave).toBe(2);
    expect(run.wavesCleared).toBe(1);
  });

  it('rerolls the draft once per run, for the cost', () => {
    const run = new RunState(1);
    expect(run.reroll(REROLL_COST)).toBe(true);
    expect(run.gold).toBe(START.gold - REROLL_COST);
    expect(run.rerollUsed).toBe(true);
    expect(run.reroll(REROLL_COST)).toBe(false);
    expect(run.gold).toBe(START.gold - REROLL_COST);
  });

  it('cannot reroll without the gold, and keeps the reroll', () => {
    const run = new RunState(1);
    run.spend(START.gold - (REROLL_COST - 1));
    expect(run.gold).toBe(REROLL_COST - 1);
    expect(run.reroll(REROLL_COST)).toBe(false);
    expect(run.rerollUsed).toBe(false);
    expect(run.gold).toBe(REROLL_COST - 1);
  });

  it('keeps the run ledger: gold earned and clean waves', () => {
    const run = new RunState(1);
    run.startWave();
    run.addKill(4);
    run.addKill(6);
    run.clearWave();
    expect(run.goldEarned).toBe(10 + RunState.waveBonus(1));
    expect(run.cleanWaves).toBe(1);

    run.startBuild(5);
    run.startWave();
    run.addKill(4);
    run.leak(1);
    expect(run.cleanWaves).toBe(1); // a wave with a leak is not clean
    run.clearWave();
    expect(run.goldEarned).toBe(14 + RunState.waveBonus(1) + RunState.waveBonus(2));
  });

  it('pays the clean streak once, on the third clean wave in a row', () => {
    const run = new RunState(1);
    run.startWave();
    run.clearWave();
    run.startWave();
    run.clearWave();
    expect(run.lives).toBe(START.lives);
    run.startWave();
    run.clearWave();
    expect(run.lives).toBe(START.lives + 1);
    expect(run.streakPaid).toBe(true);
    run.startWave();
    run.clearWave();
    run.startWave();
    run.clearWave();
    run.startWave();
    run.clearWave();
    expect(run.lives).toBe(START.lives + 1);
  });

  it('a leak resets the clean streak at once, and the next clean wave does not pay', () => {
    const run = new RunState(1);
    run.startWave();
    run.clearWave();
    run.startWave();
    run.clearWave();
    run.startWave();
    run.leak(1);
    expect(run.cleanStreak).toBe(0);
    run.clearWave();
    expect(run.lives).toBe(START.lives - 1);
    expect(run.streakPaid).toBe(false);
  });

  it('tags the clean chip 1/3, 2/3, the one +1, and nothing after', () => {
    const run = new RunState(1);
    expect(run.streakTag()).toEqual({ text: '1/3', color: PALETTE.muted });
    run.startWave();
    run.clearWave();
    expect(run.streakTag()).toEqual({ text: '2/3', color: PALETTE.muted });
    run.startWave();
    run.clearWave();
    expect(run.streakTag()).toEqual({ text: '+1', color: PALETTE.green });
    run.startWave();
    run.clearWave();
    expect(run.streakTag()).toBeUndefined();
  });
});
