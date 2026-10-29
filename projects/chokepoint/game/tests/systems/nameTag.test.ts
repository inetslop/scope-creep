import { describe, expect, it } from 'vitest';
import { ENEMIES, getEnemy } from '../../src/content/enemies';
import type { EnemyDef } from '../../src/content/types';
import { nameTag } from '../../src/systems/enemyHooks/nameTag';
import type { EnemyHookContext } from '../../src/systems/enemyHooks/hook';

/** A spawn as the hook sees it: only the fields nameTag reads. */
interface FakeEnemy {
  active: boolean;
  serial: number;
  def: EnemyDef;
  x: number;
  y: number;
}

/** A context with only what the nameTag hook uses: the pool, and an fx stub that records the labels. */
function fakeContext() {
  const all: FakeEnemy[] = [];
  const names: string[] = [];
  const ctx = {
    enemies: { all },
    fx: {
      full: false,
      scene: {
        scale: { zoom: 1 },
        add: {
          text: (_x: number, _y: number, s: string) => {
            names.push(s);
            return { width: s.length * 7, setOrigin() {} };
          },
          graphics: () => {
            const g = { fillStyle() { return g; }, fillRoundedRect() {} };
            return g;
          },
          container: () => ({ setDepth: () => ({ setScale() {} }) }),
        },
        tweens: { add() {} },
      },
      track() {},
    },
  } as unknown as EnemyHookContext;
  return { all, names, ctx };
}

describe('nameTag', () => {
  it('labels each enemy type on its first spawn of a run, and later spawns show nothing', () => {
    for (const def of ENEMIES) {
      const { all, names, ctx } = fakeContext();
      const hook = nameTag(ctx);
      all.push({ active: true, serial: 1, def, x: 100, y: 200 });
      hook.update?.(1 / 60);
      expect(names).toEqual([def.name]);
      // A second of the type, plus the first recycled (its serial bumped): neither labels again.
      all.push({ active: true, serial: 1, def, x: 300, y: 400 });
      all[0].serial += 1;
      hook.update?.(1 / 60);
      expect(names).toEqual([def.name]);
    }
  });

  it('a new run makes a fresh hook with an empty seen set, so the label comes back', () => {
    const def = getEnemy('dot');
    const { all, names, ctx } = fakeContext();
    all.push({ active: true, serial: 1, def, x: 100, y: 200 });
    nameTag(ctx).update?.(1 / 60);
    nameTag(ctx).update?.(1 / 60); // a resumed run: new hook, the seen set is empty again
    expect(names).toEqual([def.name, def.name]);
  });
});
