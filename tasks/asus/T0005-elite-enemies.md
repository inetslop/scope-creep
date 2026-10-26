---
id: T0005
title: Elite enemies
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
claimed_at: 2026-10-26T19:11:11Z
---

## Goal
Every 45 seconds an elite version of a normal enemy appears: bigger, tougher, clearly marked, and worth a pile of shards. Gives the player a mini-objective.

## Details
- Pure logic first: in `src/core/director.ts` add an elite timer to `SpawnDirector` (first elite at 45 s, then every 45 s). `update()` should report elite spawns separately, e.g. return `{ ids: string[]; elites: string[] }`. Pick the elite type from unlocked enemies with the seeded rng. Update the existing callers and the unit test, and add a test for the elite timing.
- `Enemy.spawn()` gets an `elite` flag: scale 1.8x (hitbox too), HP x5, contact damage x1.5, knockback resist +0.5 (max 1).
- Elite marker in the flat style (no glow): a `TEX.ring` image tinted `PALETTE.ink`, scaled to sit just outside the enemy, that follows it and slowly rotates — plus a small `PALETTE.red` square "badge" drawn on the ring. Both are hidden on despawn.
- On death an elite drops shards worth 6x its xp, split into 6 pickups spread around the death point, plus a bigger death effect (2 extra rings).
- Add `elitesSpawned` and `elitesKilled` counters to `hook.stats` in `debug/testHook.ts`.

## Acceptance criteria
- [ ] An elite appears at about 0:45, 1:30, 2:15... and is clearly distinguishable
- [ ] Elites are tougher and drop more shards, split into several pickups
- [ ] Pooled enemies reused after an elite are normal again (no leftover scale, ring or badge)
- [ ] Unit test for elite timing in `tests/core/`

## Design (architect, asus)

### Files
- edit `src/config.ts` - add `ELITE` tuning block (below) after `PLAYER_INVULN_MS`
- edit `src/core/director.ts` - `update()` returns `SpawnDecision`; elite timer (first at 45 s, then every 45 s)
- edit `src/art/textures.ts` - add `badge: 'badge'` to `TEX` + draw it in `generateTextures()`
- edit `src/entities/Enemy.ts` - elite flag/stats, ring+badge markers, charger scale fix
- edit `src/systems/SpawnSystem.ts` - pass director `elites` through `spawn(..., elite)`
- edit `src/systems/FxSystem.ts` - `death()` gains `extraRings` param
- edit `src/systems/CombatSystem.ts` - use `e.contactDamage`; elite death FX + 6-shard drop; counters
- edit `src/debug/testHook.ts` - `elitesSpawned`, `elitesKilled` in `HookStats` + initial object
- edit `src/scenes/GameScene.ts` - `elite-markers` invariant + `INVARIANTS` entry + `import type { Enemy }`
- edit `tests/core/core.test.ts` - destructure new return; add elite timing test
- edit `docs/ARCHITECTURE.md` - one sentence in the frame list about the elite timer

### Interfaces
```ts
// src/config.ts
export const ELITE = {
  intervalSec: 45, scale: 1.8, hpMul: 5, contactDamageMul: 1.5,
  knockbackResistBonus: 0.5, xpMul: 6, shardCount: 6, shardSpread: 26, extraDeathRings: 2,
} as const;

// src/core/director.ts
export interface SpawnDecision { ids: string[]; elites: string[] }
update(dtSec: number, timeSec: number, aliveCount: number, rng: Rng): SpawnDecision
// private nextEliteAt = ELITE.intervalSec; when timeSec >= nextEliteAt and pool non-empty:
// push rng.weighted(pool, (e) => e.spawnWeight)'s id to elites, nextEliteAt += ELITE.intervalSec.
// Elites ignore budget/maxAlive; at most one per tick; timer only advances when one is reported.

// src/entities/Enemy.ts
spawn(def: EnemyDef, x: number, y: number, hpScale: number, rng: Rng, elite: boolean = false): void
elite: boolean; contactDamage: number; knockbackResist: number;      // public, set in spawn()
readonly ring: Phaser.GameObjects.Image; readonly badge: Phaser.GameObjects.Image;
// src/systems/SpawnSystem.ts
spawn(def: EnemyDef, at?: { x: number; y: number }, elite?: boolean): Enemy | null
// src/systems/FxSystem.ts
death(x: number, y: number, body: number, accent: number, size: number, extraRings = 0): void
```

### Steps
1. `config.ts`: add `ELITE`.
2. `core/director.ts`: implement `SpawnDecision` + timer; keep the normal budget loop byte-identical inside `if (pool.length > 0)`.
3. `tests/core/core.test.ts`: change existing test to `const { ids } = director.update(...)`; add the timing test (see Tests); run `npm run test`.
4. `art/textures.ts`: `badge` key; in `generateTextures()`: `graphicsTexture(scene, TEX.badge, 28, 28, (g) => drawShape(g, 'square', 12.5, 12.5, 8, PALETTE.red, { outlineWidth: 2 }));`
5. `entities/Enemy.ts` (local consts: `RING_RADIUS_PX = 28`, `RING_CLEARANCE = 1.2`, `RING_SPIN = 1`):
   - constructor: `this.ring = scene.add.image(0, 0, TEX.ring).setTint(PALETTE.ink).setDepth(DEPTH.enemies + 1).setVisible(false); this.badge = scene.add.image(0, 0, TEX.badge).setDepth(DEPTH.enemies + 2).setVisible(false);`
   - `spawn()`: set `elite`; `private baseScale = elite ? ELITE.scale : 1` then `setScale(this.baseScale)` (Arcade circle body tracks sprite scale every frame — verified in Phaser 3.90; do NOT resize the body); `hp = maxHp = Math.max(1, Math.round(def.hp * hpScale * (elite ? ELITE.hpMul : 1)))`; `contactDamage = def.contactDamage * (elite ? ELITE.contactDamageMul : 1)`; `knockbackResist = Math.min(1, def.knockbackResist + (elite ? ELITE.knockbackResistBonus : 0))`; `ringAngle = rng.range(0, Math.PI * 2)`; `ring.setVisible(elite); badge.setVisible(elite)`; if elite: `ring.setScale((r * ELITE.scale * RING_CLEARANCE) / RING_RADIUS_PX)` and `syncEliteMarker()`.
   - `preUpdate(_time, delta)`: `super.preUpdate(_time, delta)`; return if `!this.active || !this.elite`; `ringAngle += (delta / 1000) * RING_SPIN`; `syncEliteMarker()` = ring at `(x, y)` rotation `ringAngle`; badge at `(x + cos·R, y + sin·R)` where `R = RING_RADIUS_PX * ring.scale`, rotation `ringAngle`.
   - `steer()`: charger windup uses `this.baseScale * (1 + Math.sin(this.age * 40) * 0.05)` and resets to `this.baseScale` (plain `setScale(1)` would un-elite an elite block).
   - `hit()`: use `this.knockbackResist`. `despawn()`: also hide ring+badge. `destroy(fromScene?)`: destroy ring+badge before `super` (Player.barrel pattern).
6. `systems/SpawnSystem.ts`: `const { ids, elites } = this.director.update(...)`; `for (const id of elites) this.spawn(getEnemy(id), undefined, true);`; `spawn()` takes `elite`, forwards it, and does `hook.stats.elitesSpawned += 1` when elite.
7. `systems/FxSystem.ts`: `this.rings.explode((size >= 24 ? 2 : 1) + extraRings, x, y);`
8. `systems/CombatSystem.ts`: `onPlayerTouched` → `this.run.takeDamage(e.contactDamage)`; `killEnemy`: `const size = look.radius * (e.elite ? ELITE.scale : 1)`; `fx.death(e.x, e.y, look.body, look.accent, size, e.elite ? ELITE.extraDeathRings : 0)`; `sfx.enemyDeath(size)`; if elite: loop `i < ELITE.shardCount`, `a = (i / ELITE.shardCount) * Math.PI * 2`, `pickups.drop(e.x + cos(a) * ELITE.shardSpread, e.y + sin(a) * ELITE.shardSpread, e.def.xp * (ELITE.xpMul / ELITE.shardCount))` and `hook.stats.elitesKilled += 1`; else the existing single drop.
9. `debug/testHook.ts`: add `elitesSpawned: number; elitesKilled: number;` to the interface (after `enemiesKilled`) and `elitesSpawned: 0, elitesKilled: 0,` to the initial object.
10. `scenes/GameScene.ts`: in `registerInvariants()` add `hook.addInvariant('elite-markers', () => { for (const obj of this.spawns.enemies.getChildren()) { const e = obj as Enemy; if (!e.active) continue; if (e.elite !== e.ring.visible || e.elite !== e.badge.visible) return `elite marker mismatch on ${e.def.id}`; } return null; });` and add `'elite-markers'` to the `INVARIANTS` array.
11. `docs/ARCHITECTURE.md`: extend step 5 with one sentence: the director also reports one elite every 45 s (bigger, tougher, ringed, 6x XP in 6 shards).
12. `npm run check`, then `npm run smoke`.

### Pitfalls
- Charger windup/dash `setScale` calls clobber the elite scale — route them through `baseScale` (step 5); otherwise an elite block shrinks to normal mid-run.
- Pooling: every elite field (scale, elite, contactDamage, knockbackResist, ringAngle, ring/badge visibility) is reset in `spawn()` and hidden in `despawn()`; the `elite-markers` invariant catches leftovers.
- Ring/badge are separate display-list objects, not part of the sprite: hide on despawn, destroy in `Enemy.destroy()`.
- Never call `body.setSize`/`setCircle` after `setScale` — the body resyncs from sprite scale each frame; manual resizing desyncs the hitbox.
- Enemy pool full (260): `enemies.get()` returns null, the elite is silently lost, timer still advances — acceptable, no crash.
- T0004 (floating damage numbers) will likely also touch CombatSystem/FxSystem; if it lands first, re-read those files before editing — our edits are confined to `killEnemy`, `onPlayerTouched`, `death`.
- The elite pick consumes one seeded rng draw after the normal loop, so seeded runs diverge from pre-change behavior (expected; no golden-seed tests exist).

### Tests
- `tests/core/core.test.ts`: fix existing SpawnDirector test to destructure `{ ids }`; add "reports one elite every 45 s, picked from unlocked enemies": config `{ baseBudgetPerSec: 0, budgetGrowthPerMin: 0, maxAlive: 10, maxSpawnsPerTick: 10 }`, `Rng(123)`, step `t = 1..135` with `dt = 1`, assert `ids` always empty and elite times exactly `[ELITE.intervalSec, ELITE.intervalSec * 2, ELITE.intervalSec * 3]`, and each elite id was unlocked (`unlockAtSec <= t && spawnWeight > 0`) at its time.
