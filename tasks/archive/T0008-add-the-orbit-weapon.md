---
id: T0008
title: Add the Orbit weapon
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T18:26:49Z
finished_at: 2026-10-26T18:37:02Z
---

## Goal
A new weapon: three circles that orbit the player and damage enemies on contact — a defensive, close-range build that changes how the player moves.

## Details
- New weapon "Orbit" in the weapon system, unlocked and selected the same way as Line.
- While selected: 3 blue circles (radius 8, ink outline) orbit the player at radius 70, orbit speed 2.5 rad/s, evenly spaced (120° apart). They must not hide the player.
- On contact with an enemy: 12 damage, small knockback (0.3). A given enemy can be hit by orbit circles at most once per 0.6 s.
- Orbit fires no projectiles; Point and Line work as usual when selected instead.
- New upgrade in `UPGRADES` (same shape as the Line entry): `id: 'orbit'`, `name: 'Orbit'`, `description: 'New weapon: 3 circles that orbit you and damage enemies on contact'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.blue`.

## Acceptance criteria
- [ ] The level-up menu offers the Orbit upgrade once; picking it unlocks the Orbit weapon, selectable like Line
- [ ] While Orbit is selected, 3 blue circles orbit the player and damage enemies on contact
- [ ] A given enemy takes at most one orbit hit per 0.6 s
- [ ] Switching back to Point or Line works as usual
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/weapons/orbit.ts` — Orbit weapon data
- create `src/systems/OrbitSystem.ts` — per-frame orbit logic (code in step 5)
- edit `src/content/types.ts` — add `OrbitSpec` interface; add `orbit?` field to `WeaponDef`
- edit `src/content/weapons/index.ts` — register `orbit` in `WEAPONS`
- edit `src/content/upgrades/index.ts` — append the Orbit upgrade after the `line` entry
- edit `src/art/textures.ts` — add `TEX.orbit` + `drawOrbit()`; skip `drawProjectile` for orbit weapons
- edit `src/systems/WeaponSystem.ts` — skip orbit weapons in the fire loop
- edit `src/scenes/GameScene.ts` — construct + update OrbitSystem, add invariant
- edit `tests/content.test.ts` — validate orbit weapons

### Interfaces
```ts
// content/types.ts — new interface, plus this field on WeaponDef:
//   orbit?: OrbitSpec;  // orbit weapon (handled by src/systems/OrbitSystem); projectile fields unused
export interface OrbitSpec {
  count: number;          // circles, evenly spaced (120° apart for 3)
  radius: number;         // orbit radius, world units
  speed: number;          // radians per second
  circleRadius: number;   // each circle's radius, world units
  hitCooldownSec: number; // per-enemy immunity after an orbit hit
}
// systems/OrbitSystem.ts:
//   class OrbitSystem { readonly circles: Phaser.GameObjects.Image[];
//     constructor(scene: Phaser.Scene, run: RunState, player: Player, enemies: Phaser.Physics.Arcade.Group,
//       fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, kill: (e: Enemy) => void);
//     update(dt: number): void; }
```

### Steps
1. `content/types.ts`: add `OrbitSpec` (above) and `orbit?: OrbitSpec;` to `WeaponDef` with the comment shown.
2. Create `src/content/weapons/orbit.ts` (import `PALETTE` from `'../palette'`, type `WeaponDef` from `'../types'`):
```ts
/** Unlocked by the Orbit upgrade: 3 circles that orbit the player and damage enemies on contact. */
export const orbit: WeaponDef = {
  id: 'orbit', name: 'Orbit', description: '3 circles that orbit you and damage enemies on contact.',
  fireRate: 1, count: 1, spreadDeg: 0, jitterDeg: 0, // projectile fields unused for orbit weapons, required by the type
  damage: 12, speed: 0, lifetimeSec: 0, pierce: 0, knockback: 90,
  look: { length: 8, width: 8, color: PALETTE.blue },
  orbit: { count: 3, radius: 70, speed: 2.5, circleRadius: 8, hitCooldownSec: 0.6 },
};
```
3. `weapons/index.ts`: add the import and `export const WEAPONS: readonly WeaponDef[] = [point, line, orbit];`. In `upgrades/index.ts` append after the `line` entry:
`{ id: 'orbit', name: 'Orbit', description: 'New weapon: 3 circles that orbit you and damage enemies on contact', maxLevel: 1, weight: 5, mods: [], grantsWeapon: 'orbit', color: PALETTE.blue },`
4. `textures.ts`: add `orbit: 'orbit',` to `TEX`; replace `for (const weapon of WEAPONS) drawProjectile(scene, weapon);` with a loop that calls `drawOrbit(scene, weapon)` when `weapon.orbit` is set, else `drawProjectile`; add:
```ts
function drawOrbit(scene: Phaser.Scene, def: WeaponDef): void {
  const r = def.orbit?.circleRadius ?? 8;
  const size = Math.ceil((r + PAD) * 2);
  const c = size / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, TEX.orbit, size, size, (g) => drawShape(g, 'circle', c, c, r, def.look.color, { outlineWidth: 2 }));
}
```
5. Create `src/systems/OrbitSystem.ts`. Imports: `import type Phaser from 'phaser';` + type-only `Sfx`, `WeaponDef`, `RunState`, `Enemy`, `Player`, `DamageNumbers`, `FxSystem`; value imports `TEX`, `DEPTH`, `WEAPON_BY_ID`. Fields: `readonly circles: Phaser.GameObjects.Image[] = []`; private readonly `scene, run, player, enemies, fx, sfx, damageNumbers, kill` (constructor args, assigned in that order); `private readonly lastHit = new Map<number, number>()` (scene.time.now ms of last orbit hit per enemy serial); `private angle = 0`. Constructor body after the assignments: `this.angle = run.rng.range(0, Math.PI * 2);`. `update(dt)` body:
```ts
const def = this.activeDef();
if (!def || !def.orbit) { for (const c of this.circles) c.setVisible(false); return; }
const { count, radius, speed, circleRadius, hitCooldownSec } = def.orbit;
while (this.circles.length < count) this.circles.push(this.scene.add.image(0, 0, TEX.orbit).setDepth(DEPTH.projectiles));
this.angle += speed * dt;
const now = this.scene.time.now;
const cooldownMs = hitCooldownSec * 1000;
for (const [serial, t] of this.lastHit) if (now - t > cooldownMs) this.lastHit.delete(serial); // keep the map tiny
for (let i = 0; i < count; i++) {
  const a = this.angle + (i / count) * Math.PI * 2;
  const cx = this.player.x + Math.cos(a) * radius;
  const cy = this.player.y + Math.sin(a) * radius;
  this.circles[i].setVisible(true).setPosition(cx, cy);
  for (const obj of this.enemies.getChildren()) {
    const e = obj as Enemy;
    if (!e.active) continue;
    const dx = e.x - cx;
    const dy = e.y - cy;
    const r = circleRadius + e.def.look.radius;
    if (dx * dx + dy * dy > r * r) continue;
    const last = this.lastHit.get(e.serial);
    if (last !== undefined && now - last < cooldownMs) continue; // at most one orbit hit per enemy per 0.6 s
    this.lastHit.set(e.serial, now);
    const dmg = def.damage * this.run.stats.damageMul;
    const died = e.hit(dmg, { x: cx, y: cy }, def.knockback);
    this.damageNumbers.show(e.x, e.y, dmg);
    this.fx.hit(cx, cy, e.def.look.body);
    this.sfx.hit();
    if (died) this.kill(e);
  }
}
```
Plus one private method:
```ts
/** The orbit weapon the player owns, if any (found by field, not by id). */
private activeDef(): WeaponDef | null {
  for (const id of this.run.weapons) {
    const w = WEAPON_BY_ID.get(id);
    if (w?.orbit) return w;
  }
  return null;
}
```
6. `WeaponSystem.update`: hoist `const def = getWeapon(id);` to the top of the `for (const id of this.run.weapons)` body and add `if (def.orbit) continue;` right after (orbit weapons never fire volleys).
7. `GameScene`: add fields `private combat!: CombatSystem;` and `private orbit!: OrbitSystem;` (import `OrbitSystem`). In `create()`, prefix the existing bare `new CombatSystem(...)` expression with `this.combat = `, then add:
`this.orbit = new OrbitSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));`
In `update()`, add `this.orbit.update(dt);` directly after `this.weapons.update(dt, input.firing);`. In `registerInvariants()` add:
```ts
hook.addInvariant('orbit-circles', () => {
  for (const c of this.orbit.circles) if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return `orbit circle at (${c.x}, ${c.y})`;
  return null;
});
```
and append `'orbit-circles'` to the `INVARIANTS` array.
8. `tests/content.test.ts` — in the weapons `'%s has sane numbers'` test, replace the body with:
```ts
expect(positive(w.damage), 'damage > 0').toBe(true);
expect(nonNegative(w.knockback), 'knockback >= 0').toBe(true);
if (w.orbit) {
  const o = w.orbit;
  expect(Number.isInteger(o.count) && o.count >= 1, 'orbit.count >= 1').toBe(true);
  expect(positive(o.radius) && positive(o.speed) && positive(o.circleRadius) && positive(o.hitCooldownSec), 'orbit numbers > 0').toBe(true);
  return;
}
for (const key of ['fireRate', 'count', 'speed', 'lifetimeSec'] as const) expect(positive(w[key]), `${key} > 0`).toBe(true);
for (const key of ['spreadDeg', 'jitterDeg', 'pierce'] as const) expect(nonNegative(w[key]), `${key} >= 0`).toBe(true);
expect(Number.isInteger(w.count) && Number.isInteger(w.pierce), 'count and pierce are integers').toBe(true);
```
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **There is no weapon-selection UI in the codebase**: every owned weapon is active at once (Line fires alongside Point). "Unlocked and selected the same way as Line" = granted by the level-up card, active while owned. Do NOT build a weapon-switch UI; "switching back to Point/Line" means they keep firing as usual.
- The WeaponSystem skip (step 6) is mandatory: without it Orbit would fire volleys with the missing `projectile:orbit` texture (Phaser error → smoke fails).
- The task's knockback "0.3" is not on the codebase's scale (point 90, line 40, contact 320 u/s) → use 90 in `orbit.ts`; one-line change if the PO objects.
- No physics bodies on the circles: manual distance checks vs `e.def.look.radius`; cooldown map keyed by `e.serial` (unique per spawn, pooling-safe) and pruned every frame so it stays tiny.
- Kills must go through `this.kill(e)` → `combat.killEnemy(e)` (shards, fx, sfx, hook stats) — never duplicate that path.
- Circles are scene-owned images (auto-destroyed on scene shutdown); the invariant is removed by the existing `INVARIANTS` shutdown loop. Circles never cover the player (orbit 70 > 16+8; depth 30 < 40). Orbit damage scales with `damageMul` like all damage; knockback is raw like projectiles.

### Tests
None new (no new pure `core/` logic); the step-8 `content.test.ts` change validates the new weapon and upgrade.

## Result (attempt 1, desktop)

Added the Orbit weapon: new data file `src/content/weapons/orbit.ts` (3 circles, radius 70, 2.5 rad/s, 12 dmg, knockback 90, 0.6 s per-enemy cooldown), `OrbitSpec` + optional `orbit` field in `content/types.ts`, the `orbit` upgrade in `UPGRADES`, a `TEX.orbit` texture with `drawOrbit()` in `art/textures.ts`, a new `src/systems/OrbitSystem.ts` doing per-frame orbiting and manual contact hits (kills routed through `combat.killEnemy`), a fire-loop skip for orbit weapons in `WeaponSystem`, GameScene wiring plus an `orbit-circles` invariant, and updated content tests. `npm run check` and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 10.2 min

```
game/src/art/textures.ts           | 15 ++++++-
 game/src/content/types.ts          | 16 +++++++
 game/src/content/upgrades/index.ts | 10 +++++
 game/src/content/weapons/index.ts  |  3 +-
 game/src/content/weapons/orbit.ts  | 24 ++++++++++
 game/src/scenes/GameScene.ts       | 13 +++++-
 game/src/systems/OrbitSystem.ts    | 89 ++++++++++++++++++++++++++++++++++++++
 game/src/systems/WeaponSystem.ts   |  3 +-
 game/tests/content.test.ts         | 12 ++++-
 9 files changed, 178 insertions(+), 7 deletions(-)
```
