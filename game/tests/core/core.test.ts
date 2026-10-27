import { describe, expect, it } from 'vitest';
import { ELITE } from '../../src/config';
import { ENEMIES, getEnemy } from '../../src/content/enemies';
import { UPGRADE_BY_ID, UPGRADES } from '../../src/content/upgrades';
import { SpawnDirector } from '../../src/core/director';
import { enemyHpScale, formatTime, xpToNextLevel } from '../../src/core/progression';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { BASE_STATS, computeStats } from '../../src/core/stats';
import { rollUpgradeChoices } from '../../src/core/upgrades';
import { applyDeadZone, clampLength, length, normalize } from '../../src/core/vec';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('int stays within inclusive bounds', () => {
    const rng = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('weighted never picks zero-weight items', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 200; i++) expect(rng.weighted(['a', 'b'], (x) => (x === 'a' ? 0 : 1))).toBe('b');
    expect(rng.weighted(['a'], () => 0)).toBeUndefined();
  });
});

describe('vec', () => {
  it('normalize handles zero vectors', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(length(normalize({ x: 3, y: 4 }))).toBeCloseTo(1);
  });

  it('clampLength and dead zones', () => {
    expect(length(clampLength({ x: 10, y: 0 }, 2))).toBeCloseTo(2);
    expect(applyDeadZone({ x: 0.1, y: 0 }, 0.2)).toEqual({ x: 0, y: 0 });
    expect(length(applyDeadZone({ x: 1, y: 0 }, 0.2))).toBeCloseTo(1);
  });
});

describe('stats', () => {
  it('applies add before mul and clamps', () => {
    const s = computeStats([
      { stat: 'maxHp', op: 'mul', value: 2 },
      { stat: 'maxHp', op: 'add', value: 50 },
      { stat: 'extraProjectiles', op: 'add', value: 99 },
    ]);
    expect(s.maxHp).toBe((BASE_STATS.maxHp + 50) * 2);
    expect(s.extraProjectiles).toBe(12);
  });

  it('contrast adds 10% crit chance per level', () => {
    expect(BASE_STATS.critChance).toBe(0);
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('contrast')!;
    for (let i = 0; i < 3; i++) run.applyUpgrade(def);
    expect(run.stats.critChance).toBeCloseTo(0.3); // 0.1*3 is not exact in float
  });
});

describe('RunState', () => {
  it('levels up and queues upgrade choices', () => {
    const run = new RunState(1);
    const gained = run.addXp(xpToNextLevel(1) + xpToNextLevel(2));
    expect(gained).toBe(2);
    expect(run.level).toBe(3);
    expect(run.pendingLevelUps).toBe(2);
  });

  it('armor reduces damage but a hit always deals at least 1', () => {
    const run = new RunState(1);
    run.applyUpgrade(UPGRADE_BY_ID.get('mass')!);
    const hp = run.hp;
    expect(run.takeDamage(1)).toBe(1);
    expect(run.hp).toBe(hp - 1);
  });

  it('drain ignores armor, can kill, and does nothing at 0 HP', () => {
    const run = new RunState(1);
    run.applyUpgrade(UPGRADE_BY_ID.get('mass')!);
    const hp = run.hp;
    expect(run.drain(0.5)).toBe(0.5);
    expect(run.hp).toBeCloseTo(hp - 0.5);
    expect(run.drain(9999)).toBe(hp - 0.5);
    expect(run.hp).toBe(0);
    expect(run.isDead).toBe(true);
    expect(run.drain(1)).toBe(0);
  });

  it('max HP upgrades heal by the amount gained', () => {
    const run = new RunState(1);
    run.takeDamage(50);
    run.applyUpgrade(UPGRADE_BY_ID.get('mass')!);
    expect(run.hp).toBe(75);
    expect(run.stats.maxHp).toBe(125);
  });

  it('weapon upgrades grant the weapon once', () => {
    const run = new RunState(1);
    run.applyUpgrade(UPGRADE_BY_ID.get('line')!);
    expect(run.weapons).toContain('line');
  });

  it('reports each enemy id as a first sighting exactly once', () => {
    const run = new RunState(1);
    expect(run.firstSighting('wedge')).toBe(true);
    expect(run.firstSighting('wedge')).toBe(false);
    expect(run.firstSighting('dart')).toBe(true);
  });

  it('reports each boss id as a first sighting exactly once', () => {
    const run = new RunState(1);
    expect(run.firstBossSighting('frame')).toBe(true);
    expect(run.firstBossSighting('frame')).toBe(false);
    expect(run.firstBossSighting('grid')).toBe(true);
  });

  it('tracks kill streak and best streak, reset by damage', () => {
    const run = new RunState(1);
    run.registerKill();
    run.registerKill();
    expect(run.streak).toBe(2);
    expect(run.bestStreak).toBe(2);
    run.takeDamage(5);
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(2);
    for (let i = 0; i < 5; i++) run.registerKill();
    expect(run.streak).toBe(5);
    expect(run.bestStreak).toBe(5);
  });

  it('awards score per kill class and ignores zero/negative points', () => {
    const run = new RunState(1);
    expect(run.score).toBe(0);
    run.addScore(1);
    run.addScore(5);
    run.addScore(50);
    expect(run.score).toBe(56);
    run.addScore(-5);
    run.addScore(0);
    expect(run.score).toBe(56);
  });
});

describe('upgrades', () => {
  it('rolls distinct, available choices', () => {
    const run = new RunState(3);
    const choices = rollUpgradeChoices(run.rng, UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((c) => c.id)).size).toBe(3);
  });

  it('never offers maxed upgrades', () => {
    const run = new RunState(3);
    for (const u of UPGRADES) for (let i = 0; i < u.maxLevel; i++) run.applyUpgrade(u);
    expect(rollUpgradeChoices(run.rng, UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3)).toHaveLength(0);
  });
});

describe('SpawnDirector', () => {
  it('spawns only unlocked enemies and respects maxAlive', () => {
    const director = new SpawnDirector(ENEMIES, { baseBudgetPerSec: 100, budgetGrowthPerMin: 0, maxAlive: 5, maxSpawnsPerTick: 50 });
    const { ids } = director.update(1, 0, 0, new Rng(1));
    expect(ids.length).toBe(5);
    const unlockedAtZero = new Set(ENEMIES.filter((e) => e.unlockAtSec <= 0).map((e) => e.id));
    for (const id of ids) expect(unlockedAtZero.has(id)).toBe(true);
  });

  it('reports one elite every 45 s, picked from unlocked enemies', () => {
    const director = new SpawnDirector(ENEMIES, { baseBudgetPerSec: 0, budgetGrowthPerMin: 0, maxAlive: 10, maxSpawnsPerTick: 10 });
    const rng = new Rng(123);
    const eliteTimes: number[] = [];
    const eliteIds: string[] = [];
    for (let t = 1; t <= 135; t++) {
      const { ids, elites } = director.update(1, t, 0, rng);
      expect(ids).toHaveLength(0);
      expect(elites.length).toBeLessThanOrEqual(1);
      for (const id of elites) {
        eliteTimes.push(t);
        eliteIds.push(id);
      }
    }
    expect(eliteTimes).toEqual([ELITE.intervalSec, ELITE.intervalSec * 2, ELITE.intervalSec * 3]);
    for (let i = 0; i < eliteIds.length; i++) {
      const def = getEnemy(eliteIds[i]!);
      expect(def.unlockAtSec <= eliteTimes[i]!).toBe(true);
      expect(def.spawnWeight).toBeGreaterThan(0);
    }
  });
});

describe('progression', () => {
  it('xp curve and hp scale grow', () => {
    expect(xpToNextLevel(5)).toBeGreaterThan(xpToNextLevel(1));
    expect(enemyHpScale(300)).toBeGreaterThan(enemyHpScale(0));
    expect(formatTime(125)).toBe('2:05');
  });
});
