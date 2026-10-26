---
id: T0009
title: Add the Splitter enemy
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T18:42:39Z
---

## Goal
An enemy that breaks into two on death — killing it makes things briefly worse, so the player thinks about when and where to kill it.

## Details
- New enemy "Splitter": red square, radius 18, body `PALETTE.red`, accent `PALETTE.paperLight`, spin 0.8 (slowly rotating square), behavior `chase`.
- Values: hp 35, speed 70, contactDamage 10, xp 4, threat 3, spawnWeight 3, unlockAtSec 75, knockbackResist 0.4.
- On death: in addition to its normal shard drop, it splits into two small red triangles ("Splinters"): radius 9, hp 8, speed 130, contactDamage 6, xp 1, flying apart in opposite directions along a random axis, then chasing the player.
- Create `src/content/enemies/splitter.ts` (start from a copy of `src/content/enemies/wedge.ts`) and register it and the Splinter in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] After 75 s, slowly rotating red squares appear
- [ ] Killing one spawns two small red triangles that fly apart in opposite directions and chase the player
- [ ] The Splitter still drops its normal shards when it splits
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

a data-driven `splitsInto` field on `EnemyDef`, a `burst()` method on `Enemy` reusing the knock vector, and CombatSystem spawning the children through `SpawnSystem`.

DESIGN:
### Files
- create `src/content/enemies/splitter.ts` - Splitter def (copy of wedge.ts, values below)
- create `src/content/enemies/splinter.ts` - Splinter def (copy of wedge.ts, values below)
- edit `src/content/enemies/index.ts` - import both, append to `ENEMIES`
- edit `src/content/types.ts` - add optional `splitsInto` field to `EnemyDef`
- edit `src/entities/Enemy.ts` - add public `burst()` method
- edit `src/systems/CombatSystem.ts` - take `SpawnSystem`, spawn split children in `killEnemy()`
- edit `src/scenes/GameScene.ts` - pass `this.spawns` into the `CombatSystem` constructor (line 76)
- edit `tests/content.test.ts` - validate `splitsInto` references

### Interfaces
```ts
// content/types.ts — add to EnemyDef, after knockbackResist:
  /** If set, dying also spawns this many enemies of this id at the death spot. They burst outward first. */
  splitsInto?: { id: string; count: number };

// entities/Enemy.ts — new public method (place after hit()):
  /** One-shot outward velocity (e.g. a split burst). Decays like knockback. */
  burst(dir: Vec2, speed: number): void;

// systems/CombatSystem.ts — constructor gains a final parameter:
  spawns: SpawnSystem   // import type { SpawnSystem } from './SpawnSystem';
```
Content (exact values): `splitter` — hp 35, speed 70, contactDamage 10, xp 4, threat 3, spawnWeight 3, unlockAtSec 75, behavior 'chase', knockbackResist 0.4, `splitsInto: { id: 'splinter', count: 2 }`, look `{ shape: 'square', radius: 18, body: PALETTE.red, accent: PALETTE.paperLight, spin: 0.8 }`. `splinter` — hp 8, speed 130, contactDamage 6, xp 1, threat 1, **spawnWeight 0**, unlockAtSec 0, behavior 'chase', knockbackResist 0, look `{ shape: 'triangle', radius: 9, body: PALETTE.red, accent: PALETTE.paperLight }` (no spin — it faces its movement).

### Steps
1. Add the `splitsInto` field to `EnemyDef` in `src/content/types.ts`.
2. Create `src/content/enemies/splitter.ts` and `splinter.ts` (copy `wedge.ts`'s shape, replace all values; kebab ids, `name: 'Splitter'` / `'Splinter'`).
3. `src/content/enemies/index.ts`: add imports (keep alphabetical: `sentry, splinter, splitter, wedge`) and `export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry, splitter, splinter];`
4. `src/entities/Enemy.ts`: add `burst(dir: Vec2, speed: number): void { this.knock = { x: dir.x * speed, y: dir.y * speed }; }` (Vec2 already imported).
5. `src/systems/CombatSystem.ts`: add `import { getEnemy } from '../content/enemies';`, `import type { SpawnSystem } from './SpawnSystem';`, `const SPLIT_BURST_SPEED = 320;`, field `private readonly spawns: SpawnSystem;`, constructor param + assignment. In `killEnemy()`, before `e.despawn();` add `if (e.def.splitsInto) this.split(e);`. Add:
```ts
  /** Spawns a dead enemy's split children: they burst apart along a random axis, then chase. */
  private split(e: Enemy): void {
    const spec = e.def.splitsInto;
    if (!spec) return;
    const childDef = getEnemy(spec.id);
    const angle = this.run.rng.range(0, Math.PI * 2);
    for (let i = 0; i < spec.count; i++) {
      const a = angle + (i / spec.count) * Math.PI * 2;
      const child = this.spawns.spawn(childDef, { x: e.x, y: e.y });
      if (child) child.burst({ x: Math.cos(a), y: Math.sin(a) }, SPLIT_BURST_SPEED);
    }
  }
```
6. `src/scenes/GameScene.ts` line 76: append `this.spawns` as the last argument of `new CombatSystem(...)`.
7. `tests/content.test.ts`: import `ENEMY_BY_ID` too; in `describe('enemies')` add a test: for each enemy with `splitsInto`, `count` is an integer ≥ 1, `id !== e.id` (no self-split), and `ENEMY_BY_ID.has(splitsInto.id)`.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Call `burst()` only **after** `spawns.spawn()` returns — `spawn()` resets `knock` to zero, so a burst set before it is lost.
- `spawnWeight: 0` on splinter is mandatory: the director filters `spawnWeight > 0`, so it only ever appears via splits. It still must be in `ENEMIES` so `getEnemy('splinter')` resolves and its texture is generated at boot.
- Pool exhaustion: `spawns.spawn()` returns `null` at the cap — keep the `if (child)` guard; never assume non-null.
- Use `this.run.rng` for the random axis, never `Math.random()`.
- Splinters get `enemyHpScale` for free via `spawns.spawn()` — do not bypass it by using the group directly.
- No new invariant needed: splits reuse the existing enemy pool and the `enemy-count` invariant already caps it; no new scene listeners.
- The 320 burst decays with the existing `exp(-8*dt)` knock decay (frame-rate independent): children read as flying ~0.3 s apart before chase takes over. Don't add a new state machine for this.

### Tests
- `tests/content.test.ts`: the `splitsInto` reference test above (data validation). No new `tests/core/` tests — no pure logic was added to `core/`.
