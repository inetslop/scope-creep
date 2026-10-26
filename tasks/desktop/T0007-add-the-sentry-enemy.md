---
id: T0007
title: Add the Sentry enemy
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T17:58:30Z
---

## Goal
A ranged enemy that keeps its distance and fires slow ink points, so the player must close in or dodge — the first enemy that attacks from afar.

## Details
- New enemy "Sentry": orange pentagon, radius 16, body `PALETTE.orange`, accent `PALETTE.paperLight`, spin 0.5.
- New behavior `shoot`: keeps a distance of 240–300 units from the player — backs away if closer, approaches if farther, and always drifts slowly sideways (perpendicular to the player). Speed 85.
- Every 2.4 s it fires one ink point (circle, radius 6, speed 150) at the player's current position. Telegraph: 0.4 s before the shot, its center accent flashes `PALETTE.paperLight`.
- Enemy projectiles are a new kind: they damage the player (8 damage, normal hit feedback), pass through other enemies, and despawn at the arena edge.
- Values: hp 30, contactDamage 8, xp 3, threat 3, spawnWeight 3, unlockAtSec 60, knockbackResist 0.3.
- Create `src/content/enemies/sentry.ts` (start from a copy of `src/content/enemies/wedge.ts`) and register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] After 60 s, orange pentagons appear; they hold their distance and strafe instead of just chasing
- [ ] Every ~2.4 s, after a 0.4 s flash, one fires a slow ink point at the player; the point damages the player on contact
- [ ] Sentry points pass through other enemies and despawn at the arena edge
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/sentry.ts` - Sentry data (copy of wedge.ts, values below)
- create `src/entities/EnemyBullet.ts` - pooled enemy projectile
- edit `src/content/enemies/index.ts` - import `sentry`, append to `ENEMIES`
- edit `src/content/types.ts` - add `'shoot'` to `EnemyBehavior`
- edit `src/art/textures.ts` - add `TEX.enemyShot` + draw it
- edit `src/entities/Enemy.ts` - `shoot` behavior state machine + `consumeShot()`
- edit `src/systems/SpawnSystem.ts` - own the enemy-shot pool, fire + age shots
- edit `src/systems/CombatSystem.ts` - player↔enemy-shot overlap (damage)
- edit `src/scenes/GameScene.ts` - wire new group into CombatSystem, add invariant

### Interfaces
```ts
// content/types.ts, EnemyBehavior gains:
/** Holds 240-300 units from the player, strafes, fires slow ink points. */
| 'shoot';

// entities/EnemyBullet.ts (new file):
export class EnemyBullet extends Phaser.Physics.Arcade.Image {
  damage = 0;
  lifeLeft = 0;
  constructor(scene: Phaser.Scene, x: number, y: number);
  fire(x: number, y: number, angle: number, speed: number, damage: number, lifetimeSec: number): void;
  despawn(): void;
}
// entities/Enemy.ts gains: consumeShot(): boolean  // true exactly once, frame after a 'shoot' enemy decided to fire
// systems/SpawnSystem.ts gains:
readonly enemyShots: Phaser.Physics.Arcade.Group;
get activeShotCount(): number;
get maxEnemyShots(): number;
```

### Steps
1. `sentry.ts` (exact): `id: 'sentry'`, `name: 'Sentry'`, `hp: 30`, `speed: 85`, `contactDamage: 8`, `xp: 3`, `threat: 3`, `spawnWeight: 3`, `unlockAtSec: 60`, `behavior: 'shoot'`, `knockbackResist: 0.3`, `look: { shape: 'pentagon', radius: 16, body: PALETTE.orange, accent: PALETTE.paperLight, spin: 0.5 }`.
2. `index.ts`: `import { sentry } from './sentry';` and `ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry];`.
3. `types.ts`: add the `'shoot'` union member.
4. `EnemyBullet.ts`: `super(scene, x, y, TEX.enemyShot)`; `fire()` = `this.enableBody(true, x, y, true, true); (this.body as Phaser.Physics.Arcade.Body).setCircle(6, this.width / 2 - 6, this.height / 2 - 6); this.setDepth(DEPTH.projectiles); this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed); this.damage = damage; this.lifeLeft = lifetimeSec;`; `despawn()` = `this.disableBody(true, true);` (mirror `Projectile`).
5. `textures.ts`: add `enemyShot: 'enemyShot'` to `TEX`; in `generateTextures()` after the enemy loop add `graphicsTexture(scene, TEX.enemyShot, 24, 24, (g) => drawShape(g, 'circle', 10.5, 10.5, 6, PALETTE.ink, { outlineWidth: 0 }));`.
6. `Enemy.ts`: import `distance` from `../core/vec`; add consts `SHOOT_BAND_NEAR = 240; SHOOT_BAND_FAR = 300; SHOOT_PERIOD = 2.4; SHOOT_TELEGRAPH = 0.4; SHOOT_STRAFE = 0.75;`; private fields `shootTimer = 0; shotPending = false;`; in `spawn()` after the `stateTimer` line: `this.shootTimer = rng.range(0.8, SHOOT_PERIOD); this.shotPending = false;`; new `case 'shoot'` in `steer()`:
```ts
const dist = distance(target, this);
const radial = dist < SHOOT_BAND_NEAR ? -1 : dist > SHOOT_BAND_FAR ? 1 : 0; // back off / hold / approach
const strafe = Math.sin(this.age * 1.1 + this.phase) * SHOOT_STRAFE;
vx = (toTarget.x * radial + toTarget.y * strafe) * this.def.speed;
vy = (toTarget.y * radial - toTarget.x * strafe) * this.def.speed;
this.shootTimer -= dt;
if (this.shootTimer <= SHOOT_TELEGRAPH) {
  this.setTintFill(PALETTE.paperLight); // telegraph: flash before the shot
  if (this.shootTimer <= 0) { this.shotPending = true; this.shootTimer = SHOOT_PERIOD; this.clearTint(); }
}
```
plus `consumeShot(): boolean { const pending = this.shotPending; this.shotPending = false; return pending; }`.
7. `SpawnSystem.ts`: consts `MAX_ENEMY_SHOTS = 200; ENEMY_SHOT_SPEED = 150; ENEMY_SHOT_DAMAGE = 8; ENEMY_SHOT_LIFE = 12;`; in constructor `this.enemyShots = scene.physics.add.group({ classType: EnemyBullet, maxSize: MAX_ENEMY_SHOTS, runChildUpdate: false });`; the two getters; in `update()` change the enemy loop to `if (!e.active) continue; e.steer(target, dt); if (e.consumeShot()) this.fireShot(e);` and append a second loop: `p.lifeLeft -= dt; if (p.lifeLeft <= 0 || !this.bounds.contains(p.x, p.y)) p.despawn();`; add `private fireShot(e: Enemy): void { const p = this.enemyShots.get(e.x, e.y) as EnemyBullet | null; if (!p) return; const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x); p.fire(e.x, e.y, angle, ENEMY_SHOT_SPEED, ENEMY_SHOT_DAMAGE, ENEMY_SHOT_LIFE); }`.
8. `CombatSystem.ts`: add `enemyShots: Phaser.Physics.Arcade.Group` to the `groups` param; after the existing overlaps add `scene.physics.add.overlap(player, groups.enemyShots, (_p, s) => this.onPlayerShot(as<EnemyBullet>(s)));`; add:
```ts
private onPlayerShot(p: EnemyBullet): void {
  if (!p.active || this.player.isInvulnerable(this.scene.time.now) || this.run.isDead) return;
  this.run.takeDamage(p.damage);
  this.player.invulnerableUntil = this.scene.time.now + PLAYER_INVULN_MS;
  this.fx.playerHit();
  this.sfx.playerHurt();
  p.despawn();
}
```
9. `GameScene.ts`: in the `new CombatSystem(...)` call add `enemyShots: this.spawns.enemyShots` to the groups object; in `registerInvariants()` add `hook.addInvariant('enemy-shot-count', () => (this.spawns.activeShotCount <= this.spawns.maxEnemyShots ? null : \`${this.spawns.activeShotCount} enemy shots alive\`));` and append `'enemy-shot-count'` to the `INVARIANTS` array.
10. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Telegraph: the accent is already `paperLight`, so the visible flash is `setTintFill(PALETTE.paperLight)` on the whole sprite each frame of the 0.4 s window (same idiom as `hit()`'s ink flash); `clearTint()` on fire. Don't try to tint only the dot — it's baked into the texture.
- Pooling: reset `damage`/`lifeLeft` in `fire()`; `despawn()` never `destroy()`; reset `shootTimer`/`shotPending` in `Enemy.spawn()` or reused sentries fire instantly.
- Enemy shots must NOT collide with world bounds (arcade default is off — don't enable it); the bounds check in the aging loop is the despawn path. 150 u/s × 50 ms = 7.5 u/frame, no tunneling.
- Pass-through is automatic: register no overlap/collider between `enemyShots` and `enemies`.
- NaN: `normalize()` returns (0,0) when the player is exactly on the sentry, so velocity is 0, never NaN.
- Invariant must be in the `INVARIANTS` array or it leaks across scene restarts. No new scene listeners are added, so no other shutdown work.
- Smoke test only requires no invariant failures/errors (it may not reach 60 s); sentry values already satisfy `tests/content.test.ts` ranges.

### Tests
- none (content.test.ts validates the new enemy automatically; behavior code lives in engine-side Enemy.ts, matching existing behaviors which have no unit tests)
