import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import type { FxSystem } from '../../src/systems/FxSystem';
import { ENEMY_HOOKS } from '../../src/systems/enemyHooks';
import type { EnemyHookContext } from '../../src/systems/enemyHooks/hook';
import { gorgeFeeds } from '../../src/systems/enemyHooks/gorgeFeeds';
import { split } from '../../src/systems/enemyHooks/split';

/** An FxSystem stand-in: it swallows the effects the hooks hand it (no scene, no tracking). */
function fakeFx() {
  const graphics = { setDepth: () => graphics, setPosition: () => graphics, fillStyle: () => undefined, fillPoints: () => undefined, fillCircle: () => undefined, fillRoundedRect: () => undefined };
  const label = { width: 60, setOrigin: () => label };
  const chip = { setDepth: () => chip, setScale: () => chip };
  return {
    full: false,
    scene: { scale: { zoom: 1 }, add: { graphics: () => graphics, text: () => label, container: () => chip }, tweens: { add: () => undefined } },
    track: () => undefined,
  } as unknown as FxSystem;
}

/** A context with only what these hooks use; the spawns are recorded. */
function fakeContext(pathLength: number) {
  const spawned: { id: string; hpMul: number; speedMul: number; waveSpeedMul: number; walkMul: number; distance: number }[] = [];
  const ctx = {
    board: { path: { length: pathLength } },
    enemies: { spawn: (def: { id: string }, hpMul: number, speedMul: number, waveSpeedMul: number, walkMul: number, distance: number) => spawned.push({ id: def.id, hpMul, speedMul, waveSpeedMul, walkMul, distance }) },
    towers: () => [],
  } as unknown as EnemyHookContext;
  return { ctx, spawned };
}

describe('enemy hooks', () => {
  it('every hook in ENEMY_HOOKS builds from a context', () => {
    const { ctx } = fakeContext(1000);
    for (const make of ENEMY_HOOKS) expect(typeof make(ctx)).toBe('object');
  });

  it('a splitter dies into two splinters around its spot, at its wave hp; other enemies do not split', () => {
    const { ctx, spawned } = fakeContext(1000);
    const hook = split(ctx);
    const splitter = getEnemy('splitter');
    hook.onKill?.({ enemy: { def: splitter, distance: 500, hpMul: 1.5, speedMul: 1.15, waveSpeedMul: 1.5, walkMul: 0.9 } as never, source: undefined, paid: 8 });
    expect(spawned.map((s) => s.id)).toEqual([splitter.splitsInto, splitter.splitsInto]);
    expect(spawned.every((s) => s.hpMul === 1.5)).toBe(true);
    expect(spawned.every((s) => s.speedMul === 1.15)).toBe(true); // a Swift run: the children keep the parent's factor
    expect(spawned.every((s) => s.waveSpeedMul === 1.5)).toBe(true); // a rush wave: the children keep the parent's wave factor
    expect(spawned.every((s) => s.walkMul === 0.9)).toBe(true); // a thin-road run: the children keep the parent's walk factor
    const [behind, ahead] = spawned.map((s) => s.distance).sort((a, b) => a - b);
    expect(behind).toBeLessThan(500);
    expect(ahead).toBeGreaterThan(500);
    hook.onKill?.({ enemy: { def: getEnemy('dot'), distance: 500, hpMul: 1 } as never, source: undefined, paid: 4 });
    expect(spawned).toHaveLength(2);
  });

  it('the Gorge feeds on the leaks of the others: 15% of its max hp per leak, capped at max, at most twice, never itself, never after death', () => {
    const rule = getEnemy('gorge').feeds!;
    const gorge = { def: getEnemy('gorge'), active: true, x: 0, y: 0, hp: 400, maxHp: 720, feedsUsed: 0, flash: 0, setTintFill: () => undefined };
    const splinter = { def: getEnemy('splinter'), active: true, x: 5, y: 0, hp: 15, maxHp: 15, flash: 0, setTintFill: () => undefined };
    const ctx = { enemies: { all: [gorge, splinter] }, fx: fakeFx() } as unknown as EnemyHookContext;
    const hook = gorgeFeeds(ctx);
    hook.onLeak?.(splinter as never);
    expect(gorge.feedsUsed).toBe(1);
    expect(gorge.hp).toBeCloseTo(400 + 720 * rule.frac); // the heal lands
    expect(gorge.flash).toBeGreaterThan(0); // the white flash
    hook.onLeak?.(splinter as never);
    expect(gorge.feedsUsed).toBe(2);
    expect(gorge.hp).toBeCloseTo(400 + 2 * 720 * rule.frac);
    hook.onLeak?.(splinter as never); // a third leak feeds nothing
    expect(gorge.feedsUsed).toBe(2);
    expect(gorge.hp).toBeCloseTo(400 + 2 * 720 * rule.frac);
    gorge.hp = 100;
    hook.onLeak?.(gorge as never); // its own leak is a failure, not a feed
    expect(gorge.hp).toBe(100);
    expect(gorge.feedsUsed).toBe(2);
    gorge.active = false; // a killed Gorge never revives from a later leak
    hook.onLeak?.(splinter as never);
    expect(gorge.hp).toBe(100);
    expect(gorge.feedsUsed).toBe(2);
    // and a feed never overfills: at 700 of 720, a feed puts it to max, not past
    const fresh = { def: getEnemy('gorge'), active: true, x: 0, y: 0, hp: 700, maxHp: 720, feedsUsed: 0, flash: 0, setTintFill: () => undefined };
    const ctx2 = { enemies: { all: [fresh, splinter] }, fx: fakeFx() } as unknown as EnemyHookContext;
    const hook2 = gorgeFeeds(ctx2);
    hook2.onLeak?.(splinter as never);
    expect(fresh.hp).toBe(720); // capped at max
  });
});
