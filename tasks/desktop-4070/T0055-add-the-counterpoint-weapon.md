---
id: T0055
title: Add the Counterpoint weapon
assignee: desktop-4070
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T00:59:33Z
---

## Goal
A new weapon for players who like to keep their ink in play: Counterpoint fires a point that bounces off the arena walls, so you can punish corners and the edges without re-aiming.

## Details
- New weapon "Counterpoint", unlocked the same way as Line, Orbit and Arc: a level-up card grants it, and it fires alongside your other owned weapons (there is no weapon switching — everything you own is active at once). Model the content file on the existing Point weapon (`src/content/weapons/point.ts`).
- While owned: every 0.8 s it fires one ink point toward your aim. Look: a small ink circle (radius 5), the same look as the Point projectile.
- Projectile values: speed 260 units/s, base damage 14 (scales with the damage stat and crits like all weapon damage), pierce 0, knockback 40, max lifetime 3 s.
- The bounce: when the point reaches an arena wall it reflects at the mirror angle (angle of incidence = angle of reflection) and keeps going. It may bounce at most 2 times. On each bounce its damage is multiplied by 0.75 (so 14 → 10.5 after one bounce, ≈7.9 after two). If it touches a wall a third time it is destroyed — it never bounces a third time. It also dies on an enemy hit (like a normal projectile) or when its 3 s lifetime expires, whichever comes first.
- Sound: reuse the existing shoot SFX on fire and the existing hit SFX on each wall bounce, so bounces are audible.
- New upgrade in `UPGRADES` (same shape as the Line/Orbit/Arc entries, appended at the end of the array): `id: 'counterpoint'`, `name: 'Counterpoint'`, `description: 'New weapon: a point that bounces off the arena walls'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.ink`, grants the counterpoint weapon.

## Acceptance criteria
- [ ] The level-up menu offers the Counterpoint card once; picking it makes the player fire Counterpoint points alongside Point, Line, Orbit and Arc
- [ ] Counterpoint fires one ink point every 0.8 s toward your aim at speed 260 for 14 base damage
- [ ] A point that reaches a wall reflects at the mirror angle and, on its next enemy hit, deals 75% of its pre-bounce damage (14 → 10.5 after one bounce, ≈7.9 after two)
- [ ] After two bounces the next wall contact destroys the point (it never bounces a third time); points also die on an enemy hit or after 3 s
- [ ] Each wall bounce plays the existing hit SFX; kills drop shards and play the normal death sound; Point/Line/Orbit/Arc behavior is unchanged
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/weapons/counterpoint.ts` - the new weapon data (model on `point.ts`)
- edit `src/content/types.ts` - add optional `bounce` spec to `WeaponDef`
- edit `src/content/weapons/index.ts` - import + register `counterpoint` in `WEAPONS`
- edit `src/content/upgrades/index.ts` - append the Counterpoint level-up card (only append; T0051/T0052 also touch this file)
- edit `src/entities/Projectile.ts` - bounce state fields; (re)configure body world-bounds in `fire()`
- edit `src/systems/WeaponSystem.ts` - listen to the physics world's `worldbounds` event and do the bounce bookkeeping
- edit `src/scenes/GameScene.ts` - one new invariant (additive only: T0040/T0045/T0054 also touch this file)
- edit `tests/content.test.ts` - validate `bounce` numbers on every weapon

### Interfaces
```ts
// content/types.ts — appended inside WeaponDef (after `arc?: ArcSpec;`)
bounce?: {
  /** Bounces before the next wall contact destroys the projectile. */
  maxBounces: number;
  /** Multiplied into the damage on each bounce. */
  damageMul: number;
};

// entities/Projectile.ts — new public fields (initializers as shown)
bouncing = false;
bouncesLeft = 0;
bounceDamageMul = 1;

// systems/WeaponSystem.ts — new private member (arrow property, so `this` binds)
private readonly onWorldBounds: (body: Phaser.Physics.Arcade.Body) => void;
```

### Steps
1. `src/content/types.ts`: add the `bounce?` field exactly as above, with the comment style of `orbit?`/`arc?`.
2. create `src/content/weapons/counterpoint.ts`:
```ts
import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** A point that bounces off the arena walls, so you can punish the edges without re-aiming. */
export const counterpoint: WeaponDef = {
  id: 'counterpoint',
  name: 'Counterpoint',
  description: 'Fires an ink point that bounces off the arena walls.',
  fireRate: 1.25, // one point every 0.8 s
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0,
  damage: 14,
  speed: 260,
  lifetimeSec: 3,
  pierce: 0,
  knockback: 40,
  look: { length: 10, width: 10, color: PALETTE.ink }, // equal length/width = round point, radius 5
  bounce: { maxBounces: 2, damageMul: 0.75 },
};
```
3. `src/content/weapons/index.ts`: `import { counterpoint } from './counterpoint';` and `export const WEAPONS: readonly WeaponDef[] = [point, line, orbit, arc, counterpoint];`. The `projectile:counterpoint` texture is generated automatically by `generateTextures()`.
4. `src/content/upgrades/index.ts`: append after the `tessitura` entry:
```ts
  {
    id: 'counterpoint',
    name: 'Counterpoint',
    description: 'New weapon: a point that bounces off the arena walls',
    maxLevel: 1,
    weight: 5,
    mods: [],
    grantsWeapon: 'counterpoint',
    color: PALETTE.ink,
  },
```
5. `src/entities/Projectile.ts`: add the three fields after `lifeLeft = 0;`. In `fire()`, after the `setCircle(...)` line, add:
```ts
    // Bodies are pooled and Body.reset() does not clear world-bounds state, so set it every shot:
    // bouncing weapons mirror off the arena walls and report each contact via 'worldbounds';
    // all other weapons keep ignoring the walls (collideWorldBounds defaults to false).
    const b = p.weapon.bounce ? 1 : 0;
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(b === 1, b, b, b === 1);
    this.bouncing = b === 1;
    this.bouncesLeft = p.weapon.bounce ? p.weapon.bounce.maxBounces : 0;
    this.bounceDamageMul = p.weapon.bounce ? p.weapon.bounce.damageMul : 1;
```
6. `src/systems/WeaponSystem.ts`: at the end of the constructor (after `this.projectiles = ...`) add:
```ts
    // Emitted by the physics world (per scene; the world is destroyed with the scene, so no
    // listener cleanup is needed — do NOT add one to GameScene's SHUTDOWN handler).
    scene.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, this.onWorldBounds);
```
and this private member (place it right before `update`):
```ts
  /** A Counterpoint point touched a wall: take a bounce, or die on the third contact. */
  private readonly onWorldBounds = (body: Phaser.Physics.Arcade.Body): void => {
    const p = body.gameObject as Projectile | null;
    if (!p || !p.active || !p.bouncing) return;
    if (p.bouncesLeft > 0) {
      p.bouncesLeft -= 1;
      p.damage *= p.bounceDamageMul;
      this.sfx.hit();
      if (p.bouncesLeft === 0) body.setCollideWorldBounds(true, 0, 0); // no third bounce; next contact stops it, then kills it below
    } else {
      p.despawn();
    }
  };
```
7. `src/scenes/GameScene.ts`: add `import type { Projectile } from '../entities/Projectile';` (next to the `Enemy` import); in `registerInvariants()` add after the `projectile-count` invariant:
```ts
    hook.addInvariant('bouncing-points', () => {
      const half = ARENA_SIZE / 2 + 16;
      for (const obj of this.weapons.projectiles.getChildren()) {
        const p = obj as Projectile;
        if (!p.active || !p.bouncing) continue;
        if (Math.abs(p.x) > half || Math.abs(p.y) > half) return `bouncing point outside the arena at (${p.x}, ${p.y})`;
      }
      return null;
    });
```
and append `'bouncing-points'` to the `INVARIANTS` array at the bottom.
8. `tests/content.test.ts`: in the weapons `%s has sane numbers` test, after the `count and pierce are integers` expect (this code only runs for volley weapons — orbit/arc `return` earlier), add:
```ts
    if (w.bounce) {
      expect(Number.isInteger(w.bounce.maxBounces) && w.bounce.maxBounces >= 0, 'bounce.maxBounces is an integer >= 0').toBe(true);
      expect(w.bounce.damageMul > 0 && w.bounce.damageMul <= 1, 'bounce.damageMul in (0, 1]').toBe(true);
    }
```
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- **Pooling**: a pooled body keeps `collideWorldBounds`/`worldBounce`/`onWorldBounds` from its previous shot — the `setCollideWorldBounds` call in `fire()` must run for *every* weapon or a reused Point would bounce (changing its behavior) or a reused counterpoint would skip events.
- **Do not remove the `worldbounds` listener in GameScene's SHUTDOWN handler.** The physics plugin's own shutdown runs first and sets `this.physics.world = null`, so `.off()` there throws a page error and fails the smoke test. The listener dies with the world — that is safe and intentional.
- **Third contact**: the `setCollideWorldBounds(true, 0, 0)` on the *second* bounce must omit the 4th argument — passing `false` there clears `onWorldBounds` and the third contact never reports, leaving the point wedged in the wall until its 3 s lifetime expires.
- **`fireRate: 1.25`** is "one shot every 0.8 s" (cooldown = `1 / (fireRate * fireRateMul)`). Writing `0.8` would fire every 1.25 s.
- **Damage**: the 0.75 factor multiplies the *stored* `p.damage` (already scaled by `damageMul`); crits and the normal hit SFX/knockback/shard drops stay in CombatSystem — don't re-scale or re-handle anything there.
- The `worldbounds` event fires during body integration, i.e. *before* the same frame's overlap checks, so an enemy touched at the wall in the bounce frame takes the already-reduced damage — that matches "its next enemy hit deals 75% of pre-bounce damage".
- `Sfx.hit()` is throttled to 40 ms; a very tight zigzag may play one sound for two bounces — existing engine behavior, fine.
- `content/upgrades/index.ts` (T0051/T0052) and `GameScene.ts` (T0040/T0045/T0054) are shared with open tasks: keep edits to exactly the appends/additions listed above, don't reorder or reformat existing entries.
- No new scene, UI, or input: the card is data-driven from `UPGRADES`; a grazing shot fired exactly along a wall just slides until its 3 s lifetime (degenerate mirror angle, not a bug).

### Tests
- `tests/content.test.ts` gains the `bounce` validation above (runs under `npm run check`). No new `tests/core/` tests: the bounce state machine lives on the Phaser entity, and no new pure logic was added to `core/`.
