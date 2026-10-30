import { describe, expect, it } from 'vitest';
import { BUILD_SEC } from '../../src/config';
import { ENEMIES } from '../../src/content/enemies';
import { dot } from '../../src/content/enemies/dot';
import { getLevelAugment } from '../../src/content/levels';
import { LEVEL_UNLOCK_WAVE, capLevelChoice, leanBounty, levelBuildSeconds, levelCountMul, levelMultiplier, levelMultiplierLabel, levelMultiplierTag, levelSlotsAfter, levelSpeedMul } from '../../src/core/levels';
import { killGold } from '../../src/core/lastStand';
import { RunState } from '../../src/core/run';
import { Rng } from '../../src/core/rng';
import { planWave, planWithLevel, quietGoldMul, waveHpMul, type WavePlan } from '../../src/core/waves';

describe('level augments', () => {
  it('the unlock is wave 30, and a slot is earned once and never lost', () => {
    expect(LEVEL_UNLOCK_WAVE).toBe(30);
    expect(levelSlotsAfter(0, 29)).toBe(0); // ended just short
    expect(levelSlotsAfter(0, 30)).toBe(1); // reached the unlock wave (a run dying during it counts)
    expect(levelSlotsAfter(1, 30)).toBe(1); // a second run there earns nothing more
    expect(levelSlotsAfter(1, 40)).toBe(1); // never more than one
    expect(levelSlotsAfter(1, 10)).toBe(1); // never fewer
  });

  it('the capped choice keeps only known ids, the first of them up to the slots', () => {
    expect(capLevelChoice(0, ['tough'])).toEqual([]);
    expect(capLevelChoice(1, ['tough', 'nope'])).toEqual(['tough']);
    expect(capLevelChoice(2, ['nope', 'tough'])).toEqual(['tough']);
  });

  it('the multiplier is 1 plus the chosen augments\' bonuses, and its label', () => {
    expect(levelMultiplier([])).toBe(1);
    expect(levelMultiplier(['tough'])).toBe(1.25);
    expect(levelMultiplier(['swift'])).toBe(1.15);
    expect(levelMultiplier(['crowded'])).toBe(1.2);
    expect(levelMultiplier(['swift', 'crowded'])).toBeCloseTo(1.35, 12);
    expect(levelMultiplier(['tough', 'swift', 'crowded'])).toBeCloseTo(1.6, 12);
    expect(levelMultiplier(['nope', 'tough'])).toBe(1.25);
    expect(levelMultiplier(['lean'])).toBe(1.25);
    expect(levelMultiplier(['short-fuse'])).toBe(1.3);
    expect(levelMultiplier(['lean', 'short-fuse'])).toBeCloseTo(1.55, 12);
    expect(levelMultiplier(['tough', 'lean', 'short-fuse'])).toBeCloseTo(1.8, 12);
    expect(levelMultiplierLabel([])).toBe('×1.00');
    expect(levelMultiplierLabel(['tough'])).toBe('×1.25');
    expect(levelMultiplierLabel(['swift'])).toBe('×1.15');
    expect(levelMultiplierLabel(['crowded'])).toBe('×1.20');
    expect(levelMultiplierLabel(['swift', 'crowded'])).toBe('×1.35');
    expect(levelMultiplierLabel(['tough', 'swift', 'crowded'])).toBe('×1.60');
    expect(levelMultiplierLabel(['tough', 'lean', 'short-fuse'])).toBe('×1.80');
    expect(levelMultiplierTag(1.25)).toBe('×1.25');
    expect(levelMultiplierTag(1.5)).toBe('×1.5');
  });

  it('the level augments, by id, with their card lines and bonuses', () => {
    expect(getLevelAugment('tough')).toMatchObject({ name: 'Tough', line: 'enemies +25% health', bonus: 0.25 });
    expect(getLevelAugment('lean')).toMatchObject({ name: 'Lean', line: 'kills pay 25% less gold', bonus: 0.25 });
    expect(getLevelAugment('short-fuse')).toMatchObject({ name: 'Short fuse', line: 'the build countdown runs 30% shorter', bonus: 0.3 });
    expect(getLevelAugment('nope')).toBeUndefined();
  });

  it('Lean thins the kill bounty to 75% of the enemy\'s own gold, floored down, minimum 1 gold; off it pays it whole', () => {
    expect(leanBounty(1, ['lean'])).toBe(1); // the floor: a 1-gold kill still pays 1
    expect(leanBounty(2, ['lean'])).toBe(1);
    expect(leanBounty(4, ['lean'])).toBe(3);
    expect(leanBounty(8, ['lean'])).toBe(6);
    expect(leanBounty(7, ['lean'])).toBe(5); // floored down, not rounded
    expect(leanBounty(10, [])).toBe(10); // off: the run of today
  });

  it('Lean thins the bounty before the quiet wave\'s x2 and last stand\'s x2 multiply it, as EnemySystem.kill does', () => {
    const r = new RunState(1);
    r.lives = 1; // last stand: the enemy's own gold doubles
    expect(killGold(r, leanBounty(8, ['lean']) * quietGoldMul(4))).toBe(24); // 6 x 2 x 2, not the un-Lean'd 32
    expect(killGold(r, leanBounty(8, ['lean']) * quietGoldMul(5))).toBe(12); // 6 x 1 x 2
    expect(killGold(r, leanBounty(8, []) * quietGoldMul(4))).toBe(32); // Lean off on a quiet wave: 8 x 2 x 2
  });

  it('Short fuse runs the build countdown 70% of its normal length, to the nearest second; off it is the run of today', () => {
    expect(levelBuildSeconds(BUILD_SEC.first, ['short-fuse'])).toBe(6); // 8 s -> 5.6 -> 6
    expect(levelBuildSeconds(BUILD_SEC.between, ['short-fuse'])).toBe(7); // 10 s -> 7
    expect(levelBuildSeconds(BUILD_SEC.between, ['lean', 'short-fuse'])).toBe(7); // Lean leaves the clock alone
    expect(levelBuildSeconds(BUILD_SEC.first, [])).toBe(BUILD_SEC.first);
    expect(levelBuildSeconds(BUILD_SEC.between, [])).toBe(BUILD_SEC.between);
  });

  it('Lean and Short fuse leave the wave clear bonus and the early-send bank untouched', () => {
    const r = new RunState(1);
    r.level = ['lean', 'short-fuse'];
    expect(RunState.waveBonus(3)).toBe(26);
    r.startBuild(7);
    expect(r.bankSend()).toBe(14); // 2 per whole second left on the shortened clock
  });

  it('the speed factor is the product of the chosen speedMuls: Swift alone is 1.15, the others leave it at 1', () => {
    expect(levelSpeedMul([])).toBe(1);
    expect(levelSpeedMul(['tough'])).toBe(1);
    expect(levelSpeedMul(['crowded'])).toBe(1);
    expect(levelSpeedMul(['swift'])).toBe(1.15);
    expect(levelSpeedMul(['tough', 'swift'])).toBe(1.15);
  });

  it('the count factor is the product of the chosen countMuls: Crowded alone is 1.2, the others leave it at 1', () => {
    expect(levelCountMul([])).toBe(1);
    expect(levelCountMul(['tough'])).toBe(1);
    expect(levelCountMul(['swift'])).toBe(1);
    expect(levelCountMul(['crowded'])).toBe(1.2);
    expect(levelCountMul(['swift', 'crowded'])).toBe(1.2);
  });

  it('planWithLevel sends the count times the factor, half up, the extras repeating the plan in order', () => {
    const plan = (n: number, number: number): WavePlan => ({ number, spawns: Array.from({ length: n }, (_, i) => ({ enemy: 'dot', delaySec: i === 0 ? 0 : 1 })), hpMul: 1, tags: [] });
    const five = plan(5, 5);
    const six = planWithLevel(five, 1.2);
    expect(six.spawns).toHaveLength(6); // a 5-enemy wave sends 6
    expect(six.spawns.slice(0, 5)).toEqual(five.spawns); // the wave's own entries, untouched
    expect(six.spawns[5]).toEqual(five.spawns[0]); // the extra repeats the plan's first entry
    const ten = plan(10, 11);
    const twelve = planWithLevel(ten, 1.2);
    expect(twelve.spawns).toHaveLength(12); // a 10-enemy wave sends 12
    expect(twelve.spawns.slice(0, 10)).toEqual(ten.spawns);
    expect(twelve.spawns.slice(10)).toEqual(ten.spawns.slice(0, 2)); // the extras repeat the entries in order
    expect(planWithLevel(five, 1)).toBe(five); // off: the same plan object, byte-identical
    expect(six).not.toBe(five);
    for (const wave of [10, 20, 30]) { // a boss wave keeps its own plan, same object
      const boss = planWave(wave, new Rng(wave), ENEMIES);
      expect(planWithLevel(boss, 1.2)).toBe(boss);
    }
    const quiet = planWave(4, new Rng(4), ENEMIES); // the quiet wave's already-halved final plan
    const crowded = planWithLevel(quiet, 1.2);
    expect(crowded.spawns.length).toBe(Math.floor(quiet.spawns.length * 1.2 + 0.5));
    expect(crowded.spawns.length).toBeGreaterThan(quiet.spawns.length);
  });

  it('with Tough on, an enemy has 25% more health than the wave\'s own growth gives, waves 1 to 30; off, it is the run of today', () => {
    for (let wave = 1; wave <= 30; wave++) {
      const plain = Math.round(dot.hp * waveHpMul(wave));
      expect(Math.round(dot.hp * waveHpMul(wave) * levelMultiplier(['tough']))).toBe(Math.round(dot.hp * waveHpMul(wave) * 1.25));
      expect(Math.round(dot.hp * waveHpMul(wave) * levelMultiplier([]))).toBe(plain);
    }
  });
});
