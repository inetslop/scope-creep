---
id: T0006
title: The Frame — first boss
assignee: desktop
size: L
priority: 1
status: done
depends_on: [T0005]
attempts: 1
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T21:56:56Z
finished_at: 2026-10-26T22:36:10Z
---

## Goal
At 5:00 a boss appears: a giant picture frame that charges at the player, spawns rings of wedges and bursts of ink darts, with a health bar at the top of the screen. Killing it is the run's first big moment, and it returns every 5 minutes, tougher.

## Details
- Boss "The Frame": a large ink square outline (a frame, ~160 units wide, 10 units thick) with a red square core (40 units) at its center. HP 1200, contact damage 20, speed 40 (drifts slowly toward the player).
- At 5:00 a 1 s warning: the text "THE FRAME" in large ink caps at screen center. Then the frame slides in from the top edge of the arena over 0.5 s. While the boss is alive the spawn director pauses all normal and elite spawns; they resume when it dies.
- Health bar: top center, 60% of screen width, 12 units tall, ink outline, red fill that drains. Above it, the name "THE FRAME" in small ink caps. Visible only while the boss is alive; fade out over 0.5 s on death.
- Attack patterns, cycling every 4 s, each preceded by a 0.6 s telegraph (the red core flashes paperLight):
  1. Charge: the frame dashes toward the player's position at speed 400 for 0.8 s; contact damage is 25 during the dash.
  2. Ring: spawn 10 red wedges (hp 10, speed 160, contactDamage 8) in a circle around the frame, facing outward.
  3. Burst: fire 12 slow ink darts (speed 150, damage 8 — the same values as the Sentry's shots) radially outward from the red core, reusing the existing enemy-bullet system.
- On death: shatter into 40 ink fragments, large screen shake, drop 30 xp as 10 pickups scattered around the death point. The next boss appears at 10:00 with 50% more HP (1800), then 2700, and so on.
- Add `bossKills` to `hook.stats` in `debug/testHook.ts`.
- Unit test in `tests/core/`: boss timer (first at 300 s, then 300 s after each death).

## Acceptance criteria
- [ ] At 5:00 the warning shows and The Frame enters the arena; normal and elite spawning stops while it is alive and resumes after
- [ ] The health bar with its name is visible at the top of the screen while the boss lives and fades out on death
- [ ] The boss telegraphs then cycles charge, wedge ring and radial dart burst roughly every 4 s
- [ ] The boss can be killed: it shatters, shakes the screen, and drops about 30 shards as multiple pickups
- [ ] The next boss appears 5 minutes later with 50% more HP
- [ ] Unit test for the boss timer in `tests/core/`

## Design (architect, desktop)

### Files
- create `src/core/boss.ts` — pure `BossTimer` + `bossHpMultiplier` (no Phaser, unit-tested).
- create `src/content/bosses/frame.ts` — `BossDef` interface + `FRAME` data (every boss number lives here).
- create `src/content/enemies/frameWedge.ts` — ring wedge `EnemyDef` (hp 10, speed 160, contactDamage 8, xp 1, `spawnWeight: 0` so the director never spawns it).
- create `src/entities/serial.ts` — shared per-spawn id: `takeSerial(): number`.
- create `src/entities/Boss.ts` — boss entity: frame sprite with red core as child sprite, circle body.
- create `src/systems/BossSystem.ts` — encounter state machine + projectile/player overlaps + death.
- create `tests/core/boss.test.ts` — boss timer tests.
- edit `src/core/run.ts` — add boss fields (Interfaces).
- edit `src/content/enemies/index.ts` — add `frameWedge` to `ENEMIES`.
- edit `src/art/textures.ts` — `TEX.bossFrame`/`TEX.bossCore` + `drawBoss()` called from `generateTextures()`.
- edit `src/entities/Enemy.ts` — replace local `nextSerial` with `takeSerial()`.
- edit `src/systems/SpawnSystem.ts` — pause director while `run.bossAlive`; `spawn()` gains optional `hpScale`; new public `fireDart()`.
- edit `src/systems/FxSystem.ts` — `shatter(x, y, count)` (ink-tinted fragments emitter).
- edit `src/audio/Sfx.ts` — `bossWarn()` (two low sawtooth notes, like `levelUp()`).
- edit `src/debug/testHook.ts` — `bossKills: number` in `HookStats`, init 0.
- edit `src/scenes/GameScene.ts` — construct/update `BossSystem`, `boss-state` invariant.
- edit `src/scenes/HudScene.ts` — health bar + name + warning text + 0.5 s fade.

### Interfaces
```ts
// core/boss.ts
export interface BossSchedule { firstAtSec: number; intervalSec: number; }
export const BOSS_SCHEDULE: BossSchedule; // { firstAtSec: 300, intervalSec: 300 }
export function bossHpMultiplier(kills: number): number; // Math.pow(1.5, kills)
export class BossTimer {
  constructor(schedule?: BossSchedule);
  due(timeSec: number, bossAlive: boolean): boolean; // !bossAlive && timeSec >= nextAt
  onBossKilled(timeSec: number): void; // nextAt = timeSec + intervalSec
}
// core/run.ts — new public fields, BossSystem owns the writes:
bossAlive = false; bossWarning = false; bossHp = 0; bossMaxHp = 0; bossKills = 0;
// content/bosses/frame.ts — all numbers from the task:
export interface BossDef { id; name; hp; speed; contactDamage; dashContactDamage; frameSize; frameThickness; coreSize; dashSpeed; dashDurationSec; attackCycleSec; telegraphSec; ringCount; ringRadius; burstCount; deathXp; deathPickups; ringEnemyId; look: { frame: number; core: number } }
export const FRAME: BossDef; // 'frame','THE FRAME',1200,40,20,25,160,10,40,400,0.8,4,0.6,10,120,12,30,10,'frame-wedge',{ink,red}
// entities/Boss.ts
export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly core: Phaser.GameObjects.Image; hp = 0; maxHp = 0; serial = 0; flashMs = 0;
  constructor(scene: Phaser.Scene); // add.existing + physics.add.existing, then disableBody(true, true): dormant
  spawn(x: number, y: number, hp: number): void; // enableBody(true,x,y,true,true), setCircle(frameSize/2, off, off), setCollideWorldBounds(false), setVelocity(0,0), serial=takeSerial()
  hit(damage: number): boolean; // hp -= damage; flashMs = 60; NO knockback
  despawn(): void; // disableBody(true, true)
}
// systems/BossSystem.ts
export class BossSystem {
  readonly boss: Boss;
  constructor(scene: Phaser.Scene, run: RunState, player: Player, spawns: SpawnSystem, projectiles: Phaser.Physics.Arcade.Group, fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, pickups: PickupSystem);
  update(dt: number): void;
}
// systems/SpawnSystem.ts — changed:
spawn(def: EnemyDef, at?: { x: number; y: number }, hpScale?: number): Enemy | null; // default enemyHpScale(run.timeSec)
fireDart(x: number, y: number, angle: number): void; // one EnemyBullet at the existing 150/8/12s values
```

### Steps
1. `core/boss.ts` + `tests/core/boss.test.ts`; run `npm run test`.
2. Content: `frame.ts`, `frameWedge.ts`, register in `enemies/index.ts`; `npm run check` (content.test validates the wedge automatically).
3. `textures.ts`: frame texture = `strokeRect` 160×160 lw 10 ink plus the same rect offset (3,3) at alpha 0.18 (paper-cut shadow); core = `drawShape(g,'square',c,c,40/Math.SQRT2,FRAME.look.core,{outlineWidth:3})`; call `drawBoss(scene)` in `generateTextures()`.
4. `serial.ts`; point `Enemy.ts` at `takeSerial()`.
5. `Boss.ts` per Interfaces.
6. `run.ts` fields.
7. `SpawnSystem`: wrap the `director.update` + spawn loop in `if (!this.run.bossAlive)`; add `hpScale` param; add `fireDart()`.
8. `FxSystem.shatter`, `Sfx.bossWarn`.
9. `BossSystem.ts`: phases `'off'|'warning'|'entering'|'fighting'`. warning: 1 s, `run.bossWarning=true`, `sfx.bossWarn()`. entering: spawn boss at `(clamped player.x, -ARENA_SIZE/2 - 100)`, set `run.bossAlive/bossHp/bossMaxHp` (hp = `Math.round(FRAME.hp * bossHpMultiplier(run.bossKills))`), lerp position over 0.5 s to `(player.x, player.y - 320)` clamped to arena ±100, then `setCollideWorldBounds(true)`. fighting: drift toward player at `FRAME.speed`; `cycleTimer` 4→0, `telegraphing = cycleTimer <= 0.6`; at 0 execute attack `attackIndex` then `(attackIndex+1)%3`: 0 charge (`dashDir = normalize(sub(player, boss))` — keep old dir if zero; velocity `dashSpeed`, 0.8 s), 1 ring (10× `spawns.spawn(getEnemy(FRAME.ringEnemyId), pos, 1)` at radius 120, `e.setRotation(outwardAngle)`), 2 burst (12× `spawns.fireDart` evenly radial, random start angle from `run.rng`). Every frame: decrement `flashMs` by `dt*1000`; core tint = `flashMs>0` ? ink : `telegraphing` ? paperLight : `clearTint()`. Overlaps (register in constructor, like CombatSystem, with the local `as<T>()` helper): projectiles→boss (skip if `!p.active || !boss.active || p.hitSerials.has(boss.serial)`; add serial, `b.hit(p.damage)`, `run.bossHp = Math.max(0, b.hp)`, damageNumbers/fx.hit/sfx.hit, `p.pierceLeft -= 1`, despawn if < 0, `killBoss()` if dead); player→boss (`takeDamage(charging ? 25 : 20)`, `invulnerableUntil = now + PLAYER_INVULN_MS`, fx.playerHit, sfx.playerHurt). `killBoss()`: phase 'off', `run.bossAlive=false, bossHp=0, bossKills+=1`, `hook.stats.bossKills += 1`, `timer.onBossKilled(run.timeSec)`, `fx.shatter(x,y,40)`, `fx.shake(600, 0.02)`, `sfx.enemyDeath(80)`, 10× `pickups.drop` with `run.rng` scatter (radius 20–140) of 3 xp each, `boss.despawn()`.
10. `testHook.ts` `bossKills`.
11. `GameScene`: after combat, `this.boss = new BossSystem(this, this.run, this.player, this.spawns, this.weapons.projectiles, this.fx, this.sfx, this.damageNumbers, this.pickups)`; in `update()` call `this.boss.update(dt)` right after `this.spawns.update(dt)`; add `boss-state` invariant (finite position while active, `run.bossAlive === boss.active`, `0 <= hp <= maxHp` while active) and its name to the `INVARIANTS` array.
12. `HudScene`: change to `update(_time: number, delta: number)`; warning text `textStyle(48, PALETTE.ink, {fontStyle:'bold'})` with `FRAME.name`, origin (0.5,0.5), screen center, alpha 1 while `run.bossWarning` else 0; boss bar in its OWN `Graphics` (the main `g` is cleared every frame): name `textStyle(14,...)` at `(width/2, top)` origin (0.5,0), bar via `drawBar` generalized to take a `Graphics` param — `drawBar(bossG, (width - width*0.6)/2, top + 18, width*0.6, 12, clamp(bossHp/bossMaxHp), PALETTE.red)`; `top = (narrow ? PAD + 40 : PAD) + 26` (below the top-center timer); while `!run.bossAlive` fade `bossG`/name alpha by `delta/1000/0.5` without clearing pixels, then clear at 0.
13. `npm run check`.

### Pitfalls
- `enableBody(reset, x, y, enableGameObject, showGameObject)` — first arg is `reset`, and `this.body` must already exist: create it in the constructor (`scene.add.existing(this)` + `scene.physics.add.existing(this)`) and immediately `disableBody(true, true)` so the dormant body at (0,0) is never stepped.
- The boss starts above the arena (y = -1700): keep `setCollideWorldBounds(false)` during the slide-in or physics clamps it to the arena top and the entry breaks; re-enable when entering finishes.
- Body position syncs from the sprite every frame (`Body.preUpdate` → `updateFromGameObject`), so `setPosition()` lerps work for the slide-in; zero the velocity in `spawn()`.
- The director gate must wrap BOTH `director.update()` and the spawn loop, or the threat budget keeps accumulating during the fight and bursts on resume. If T0005 (elites) later adds a separate spawn path, it must also check `run.bossAlive`.
- HUD: the boss bar needs its own Graphics object; during the 0.5 s fade do NOT clear it — lower alpha on the last-drawn pixels. Keep the bar below the timer (desktop top=38, narrow=78) or it overlaps at 412×915.
- Do NOT make the boss an `EnemyDef` or add it to the enemy group: it is a unique entity with its own overlaps. The orbit weapon intentionally does not hit it (players always keep the point weapon).
- `no-case-declarations`: wrap switch cases that declare variables in braces; overlap callbacks are untyped — use the `as<T>()` helper like `CombatSystem`.
- `hook.stats.bossKills` is cumulative across runs (`+= 1` in killBoss); `run.bossKills` is per-run and drives HP scaling. All boss randomness via `run.rng` (seeded), never `Math.random()`.
- Ring wedges and darts reuse the enemy pools; `spawn()`/`fireDart()` already no-op when a pool is full.

### Tests
- `tests/core/boss.test.ts`: first boss due at exactly 300 s (not at 299.9, never while one is alive); due 300 s after each `onBossKilled` (300→600→900); a custom `BossSchedule`; `bossHpMultiplier` 1/1.5/2.25 → 1200/1800/2700.
- `tests/content.test.ts` validates `frame-wedge` automatically; no changes needed.

## Result (attempt 1, desktop)

Added the first boss, The Frame: pure `BossTimer`/`bossHpMultiplier` in `src/core/boss.ts` (unit-tested in `tests/core/boss.ts`), all boss numbers in `src/content/bosses/frame.ts`, a `frame-wedge` minion enemy, the `Boss` entity and `BossSystem` encounter state machine (warning → slide-in → fight with charge/ring/burst cycling every 4 s with a 0.6 s telegraph, 1.5× HP per kill), a top-center health bar + name + center warning with 0.5 s death fade in `HudScene`, `bossKills` in the test hook, and a `boss-state` invariant. Two minimal deviations from the design: `SpawnSystem.spawn()` keeps the existing `elite` param and takes `hpScale` as a 4th argument (the design's 3-arg signature would have dropped elite spawning), and the red core is a separate image pinned in POST_UPDATE because Phaser 3.90 sprites have no `addChild` (matching the existing barrel/orbit pinning pattern). Verified with `npm run check`, `npm run smoke`, and temporary in-browser runs of the full encounter and kill paths.

- Self-review: APPROVE
- Time: 39.2 min

```
game/src/art/textures.ts               |  26 ++++
 game/src/audio/Sfx.ts                  |   7 +
 game/src/content/bosses/frame.ts       |  74 +++++++++++
 game/src/content/enemies/frameWedge.ts |  23 ++++
 game/src/content/enemies/index.ts      |   3 +-
 game/src/core/boss.ts                  |  39 ++++++
 game/src/core/run.ts                   |   6 +
 game/src/debug/testHook.ts             |   2 +
 game/src/entities/Boss.ts              |  69 ++++++++++
 game/src/entities/Enemy.ts             |   5 +-
 game/src/entities/serial.ts            |   9 ++
 game/src/scenes/GameScene.ts           |  15 ++-
 game/src/scenes/HudScene.ts            |  38 +++++-
 game/src/systems/BossSystem.ts         | 234 +++++++++++++++++++++++++++++++++
 game/src/systems/FxSystem.ts           |   6 +
 game/src/systems/SpawnSystem.ts        |  22 +++-
 game/tests/core/boss.test.ts           |  49 +++++++
 17 files changed, 613 insertions(+), 14 deletions(-)
```
