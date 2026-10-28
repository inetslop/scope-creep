import { describe, expect, it } from 'vitest';
import { getEnemy } from '../../src/content/enemies';
import { ENEMY_HOOKS } from '../../src/systems/enemyHooks';
import type { EnemyHookContext } from '../../src/systems/enemyHooks/hook';
import { split } from '../../src/systems/enemyHooks/split';

/** A context with only what these hooks use; the spawns are recorded. */
function fakeContext(pathLength: number) {
  const spawned: { id: string; hpMul: number; distance: number }[] = [];
  const ctx = {
    board: { path: { length: pathLength } },
    enemies: { spawn: (def: { id: string }, hpMul: number, distance: number) => spawned.push({ id: def.id, hpMul, distance }) },
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
    hook.onKill?.({ enemy: { def: splitter, distance: 500, hpMul: 1.5 } as never, source: undefined, paid: 8 });
    expect(spawned.map((s) => s.id)).toEqual([splitter.splitsInto, splitter.splitsInto]);
    expect(spawned.every((s) => s.hpMul === 1.5)).toBe(true);
    const [behind, ahead] = spawned.map((s) => s.distance).sort((a, b) => a - b);
    expect(behind).toBeLessThan(500);
    expect(ahead).toBeGreaterThan(500);
    hook.onKill?.({ enemy: { def: getEnemy('dot'), distance: 500, hpMul: 1 } as never, source: undefined, paid: 4 });
    expect(spawned).toHaveLength(2);
  });
});
