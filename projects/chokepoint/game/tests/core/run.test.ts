import { describe, expect, it } from 'vitest';
import { START, rerollCost } from '../../src/config';
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

  it('scores the run: the cleared waves at a hundred, the stopped enemies at one', () => {
    const run = new RunState(1);
    expect(run.score).toBe(0);
    run.startWave();
    run.addKill(3);
    run.clearWave();
    expect(run.score).toBe(101);
    run.startBuild(5);
    run.startWave();
    run.addKill(7);
    run.leak(START.lives);
    expect(run.score).toBe(102);
  });

  it('the payout score wears the level augments\' multiplier, rounded down; without one it is the score as is', () => {
    const run = new RunState(1);
    run.startWave();
    run.kills = 31;
    run.clearWave();
    expect(run.score).toBe(131);
    expect(run.finalScore).toBe(131); // no level augments on: byte-identical
    run.level = ['tough'];
    expect(run.levelHpMul).toBe(1.25);
    expect(run.finalScore).toBe(163); // floor 163.75
  });

  it("rerolls charge the run's curve and climb", () => {
    const run = new RunState(1);
    for (let n = 0; n <= 5; n += 1) {
      run.gold = 1000;
      expect(run.reroll()).toBe(true);
      expect(run.gold).toBe(1000 - rerollCost(n));
      expect(run.rerollsUsed).toBe(n + 1);
    }
  });

  it('cannot reroll without the gold, and pays nothing', () => {
    const run = new RunState(1);
    run.gold = rerollCost(0) - 1;
    expect(run.reroll()).toBe(false);
    expect(run.rerollsUsed).toBe(0);
    expect(run.gold).toBe(rerollCost(0) - 1);
    run.gold = rerollCost(0);
    expect(run.reroll()).toBe(true);
    run.gold = rerollCost(1) - 1;
    expect(run.reroll()).toBe(false);
    expect(run.rerollsUsed).toBe(1);
    expect(run.gold).toBe(rerollCost(1) - 1);
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

  it('banks the build countdown when the wave is sent early: 2 gold per whole second left', () => {
    const run = new RunState(1);
    run.startBuild(30);
    expect(run.bankSend()).toBe(60); // 30 s left reads "+60"
    expect(run.gold).toBe(START.gold + 60);
    expect(run.buildLeftSec).toBe(0);
  });

  it('banks whole seconds only; the last partial second and a second send bank nothing', () => {
    const run = new RunState(1);
    run.startBuild(2.9);
    expect(run.bankSend()).toBe(4);
    expect(run.bankSend()).toBe(0);
    run.startBuild(0.4);
    expect(run.bankSend()).toBe(0);
    expect(run.gold).toBe(START.gold + 4);
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

  it('says the clean streak in words: building, the paying wave, then only the coin', () => {
    const run = new RunState(1);
    const clean = (): string | undefined => {
      run.startWave();
      const paidBefore = run.streakPaid;
      run.clearWave();
      return run.cleanStreakLine(!paidBefore && run.streakPaid);
    };
    expect(clean()).toBe('1 of 3 in a row for +1 life');
    expect(clean()).toBe('2 of 3 in a row for +1 life');
    expect(clean()).toBe('3 in a row: +1 life');
    run.startWave();
    run.leak(1); // the streak resets, but the run's one pay is already spent
    expect(clean()).toBeUndefined();
    expect(clean()).toBeUndefined();
  });
});
