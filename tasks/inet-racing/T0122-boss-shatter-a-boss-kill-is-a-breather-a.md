---
id: T0122
title: Boss shatter — a boss kill is a breather and a payday
assignee: inet-racing
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
The moment any boss dies, every enemy projectile on screen bursts into shards — the fight clears into loot, and a boss kill is a breather as well as a win.

## Details
- The moment any boss dies (The Frame, The Grid, The Palette — and The Press once T0116 lands), every enemy projectile on screen converts into one normal shard at its position: the projectile is removed, and a standard shard spawns in its place through the normal shard-drop path — standard size, motion and XP, and the 5% gilt roll (T0112) applies to these drops like any other.
- A small flat ink ring pops at each converted position (reuse the existing ring FX, small) so the shatter reads as one beat.
- The standard boss death plays exactly as it does today, on top of the shatter: the shake (T0040), the sting (T0058), the boss-music return (T0108) and the "+50" kill feed (T0106) are all unchanged.
- The conversion happens exactly once per boss death, at the moment of death; enemy projectiles that exist after the death are normal projectiles again.
- No new HUD element, key, scene or sound (the ring is visual only); no change to shard values or pickup rules.

## Acceptance criteria
- [ ] The moment any boss dies, every enemy projectile on screen becomes exactly one normal shard at its position, with a small flat ink ring at each position; the converted projectiles are gone.
- [ ] The converted shards are collectible like normal shards (standard XP, standard pickup radius, the gilt roll applies); the number of shards equals the number of enemy projectiles on screen at the moment of death.
- [ ] The standard boss death plays unchanged (shake, sting, music return, "+50" kill feed); enemy projectiles that exist after the death behave as normal projectiles.
- [ ] No new HUD element, key, scene or sound is added; `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/systems/BossShatter.ts` — one-shot boss shatter: converts every live enemy shot into one normal shard + a small ink ring. Exports `SHATTER_SHARD_VALUE` and `shatterEnemyShots()`.
- edit `src/systems/BossSystem.ts` — import the helper; call it once inside `killBoss()`.
- edit `src/scenes/GameScene.ts` — one `shard-pool` invariant in `registerInvariants()`.

### Interfaces
```ts
// src/systems/BossShatter.ts
export const SHATTER_SHARD_VALUE = 1;
export function shatterEnemyShots(
  shots: Phaser.Physics.Arcade.Group,
  pickups: PickupSystem,
  fx: FxSystem,
): number;
```

### Exact code
`src/systems/BossShatter.ts` (whole new file):
```ts
import type Phaser from 'phaser';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { FxSystem } from './FxSystem';
import type { PickupSystem } from './PickupSystem';

/** XP of the shard a shattered enemy shot becomes: the base fodder drop. */
export const SHATTER_SHARD_VALUE = 1;

/**
 * Boss shatter: the moment a boss dies, every live enemy shot on the page becomes
 * one normal shard at its position, with a small flat ink ring so the clear reads
 * as one beat. Called exactly once, at the moment of death (BossSystem.killBoss).
 * Shots fired after the death are normal shots again. Returns the shots converted.
 */
export function shatterEnemyShots(
  shots: Phaser.Physics.Arcade.Group,
  pickups: PickupSystem,
  fx: FxSystem,
): number {
  let count = 0;
  for (const obj of shots.getChildren()) {
    const p = obj as EnemyBullet;
    if (!p.active) continue;
    const x = p.x;
    const y = p.y;
    p.despawn();
    pickups.drop(x, y, SHATTER_SHARD_VALUE); // standard drop: size, motion, XP + the 5% gilt roll
    fx.critRing(x, y); // the existing small ink ring
    count += 1;
  }
  return count;
}
```

`BossSystem.ts` — two additions only:
- import, on the line immediately **before** `import type { DamageNumbers } from './DamageNumbers';`:
  `import { shatterEnemyShots } from './BossShatter';`
- in `killBoss()`, on the line immediately **after** `this.fx.shatter(x, y, 40);`:
  `shatterEnemyShots(this.spawns.enemyShots, this.pickups, this.fx);`

`GameScene.ts` — in `registerInvariants()`, immediately **after** the line registering the `'enemy-shot-count'` invariant:
```ts
hook.addInvariant('shard-pool', () => {
  const n = this.pickups.shards.countActive(true);
  return n <= this.pickups.shards.maxSize ? null : `${n} shards on screen`;
});
```

### Steps
1. Create `src/systems/BossShatter.ts` exactly as above.
2. In `BossSystem.ts` add the import and the one `killBoss()` call (anchors above).
3. In `GameScene.ts` add the `shard-pool` invariant.
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- One-shot, **not** a system: do NOT add it to GameScene `create()`/`update()`, give it an `update()` loop, or construct it in GameScene. It is a plain function invoked from `killBoss()`.
- Exactly once: `killBoss()` is the only death path for Frame/Grid (projectile) and Palette (cascade done). Do not add a second trigger and do not poll `run.bossKills`.
- Despawn while iterating `getChildren()` is safe: `despawn()` (disableBody) deactivates but does not remove the child, and the `p.active` check skips dead shots (same check `SpawnSystem.update` uses).
- Do NOT filter by the camera view rect; "on screen" means `p.active`.
- Shard pool cap (350): `pickups.drop` already awards XP directly when full, so a 200-shot flood can't crash or lose XP; the `shard-pool` invariant guards overflow.
- Visual only: no `Sfx` call, no HUD, no new key/scene/sound; the ring reuses `fx.critRing`.
- The Press (T0116) is covered automatically when it lands, provided its death goes through `killBoss()` — no dependency on it.

### Tests
none
