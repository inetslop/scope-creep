---
id: T0136
title: The Fresco weapon — the trail you leave bites
assignee: inet-racing
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
---

## Goal
A new standing weapon that turns movement into the weapon: while you move you lay a 40-unit ink trail on the page, and enemies that cross it take a bite — kiting, which today is only escape, becomes attack.

## Details
- New level-up card, a new-weapon card in the same style as the Orbit/Arc cards (ink, weight 4, maxLevel 1): "New weapon: a Fresco — while you move, you leave a 40-unit ink trail that bites enemies that cross it."
- The pool: the card takes the pool slot of Draft (the +25% projectile-speed card), which this task retires — Draft is removed from the pool, is never offered again and is never drawn by Warm Start (T0114); the pool stays at 16. T0119 is retiring Momentum in the same window; the two tasks retire different cards and land in either order.
- A standing weapon like the Orbit: no volleys, the Point keeps firing normally.
- The trail: while the player is actually moving (any direction), a flat ink patch is stamped every 40 ms at the player's position — 40 u wide, 18 u long, aligned with the direction of travel, alpha 40% fading linearly to 0 over its 2.0 s life. Standing still stamps nothing; existing patches keep fading, so the trail is fully gone 2.0 s after the player stops.
- Pooled: at most 50 live patches (a full 2.0 s at 40 ms), oldest recycled; drawn under the entities on the same layer as the puddles (T0111) and the enemy trails (T0126).
- Damage: an enemy or elite first overlapping a patch takes 10 damage — once per enemy per patch (re-crossing the same patch is free; a new patch bites again) — with the normal hit flash and damage number. The bite scales with the player's damage stat and rolls crits like a weapon hit, so Underexposure (T0105) and Contrast apply. Bosses, their parts and enemy bullets are untouched by the trail.
- The trail is on the paper: it is not pushed by the Platen's slams (T0091), it interacts with no hazard, and it is stamped at the player's position (always inside the safe rect) so the Crop (T0045) and Tide (T0127) need no special-casing.
- No new key, HUD element, SFX or scene.

## Acceptance criteria
- [ ] Level-up offers include the Fresco card in ink style; after the change, Draft is never offered, never drawn by Warm Start, and the pool contains 16 cards.
- [ ] While moving, a flat ink trail about 2 s long (40 u wide) fades behind the player; while standing still nothing new is stamped and the trail is gone within 2 s.
- [ ] An enemy crossing a trail patch takes 10 damage once, with the hit flash and damage number; the same enemy crossing the same patch a second time takes no more, a fresh patch re-damages it; crits and Underexposure apply to bites.
- [ ] The Point still fires normally while Fresco is owned; bosses and enemy bullets are untouched by the trail; no new key, HUD element, sound or scene.

## Design (architect, desktop)

### Files
- create `src/content/weapons/fresco.ts` - the weapon data (modeled on `orbit.ts`)
- create `src/core/fresco.ts` - pure hit tests: patch box vs circle, vs capsule axis (no Phaser)
- create `src/systems/FrescoSystem.ts` - pooled 50 ink patches: stamp while moving, fade 2 s, bite enemies once per enemy per patch
- create `tests/core/fresco.test.ts` - pins the hit-test geometry
- edit `src/content/types.ts` - `FrescoSpec` interface + `WeaponDef.fresco?`
- edit `src/content/weapons/index.ts` - import + register in `WEAPONS`
- edit `src/content/upgrades/index.ts` - replace the `draft` entry in place with the Fresco card (pool stays 16)
- edit `src/art/textures.ts` - `TEX.fresco` key, `drawFresco()`, branch in the weapon loop
- edit `src/systems/WeaponSystem.ts` - skip fresco volleys in `update()`
- edit `src/scenes/GameScene.ts` - import, field, construct, `update()` call, invariant
- edit `tests/content.test.ts` - fresco branch in the weapons sanity test
- edit `tests/core/upgrades.test.ts` - line 19: `'draft'` → `'mass'` in the `maxed` list

### Interfaces
```ts
// content/types.ts — new interface after ArcSpec; new WeaponDef field after `arc?: ArcSpec;`
export interface FrescoSpec {
  /** Seconds between stamps while the player moves (0.04). */
  stampIntervalSec: number;
  /** Patch lifetime in seconds; image alpha fades linearly to 0 over it (2.0). */
  lifeSec: number;
  /** Starting alpha baked into the patch texture (0.4). */
  alpha: number;
  /** Most live patches (50 = a full 2.0 s at 0.04 s); the oldest is recycled. */
  maxPatches: number;
}
// WeaponDef:  /** Fresco weapon (handled by src/systems/FrescoSystem); projectile fields unused. */
//             fresco?: FrescoSpec;

// content/weapons/fresco.ts
export const fresco: WeaponDef = {
  id: 'fresco', name: 'Fresco', description: 'A 40-unit ink trail laid while you move that bites enemies that cross it.',
  fireRate: 1, count: 1, spreadDeg: 0, jitterDeg: 0, // projectile fields unused, required by the type
  damage: 10, speed: 0, lifetimeSec: 0, pierce: 0, knockback: 0, // on the paper: bites, does not shove
  look: { length: 18, width: 40, color: PALETTE.ink }, // length = along travel, width = across
  fresco: { stampIntervalSec: 0.04, lifeSec: 2.0, alpha: 0.4, maxPatches: 50 },
};
// upgrades/index.ts — replaces the draft entry, same position:
{ id: 'fresco', name: 'Fresco', description: 'New weapon: while you move, you leave a 40-unit ink trail that bites enemies that cross it.',
  maxLevel: 1, weight: 4, mods: [], grantsWeapon: 'fresco', color: PALETTE.ink },

// core/fresco.ts — exact (this file is only this):
export interface FrescoPatch { x: number; y: number; angle: number; halfLen: number; halfWid: number; }
function toLocal(patch: FrescoPatch, px: number, py: number): { x: number; y: number } {
  const dx = px - patch.x, dy = py - patch.y;
  const c = Math.cos(patch.angle), s = Math.sin(patch.angle);
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
/** True when a circle of `radius` at (px,py) touches the patch. Exact. */
export function patchHitsCircle(patch: FrescoPatch, px: number, py: number, radius: number): boolean {
  const l = toLocal(patch, px, py);
  const cx = Math.max(-patch.halfLen, Math.min(patch.halfLen, l.x));
  const cy = Math.max(-patch.halfWid, Math.min(patch.halfWid, l.y));
  const dx = l.x - cx, dy = l.y - cy;
  return dx * dx + dy * dy <= radius * radius;
}
/** True when segment (x1,y1)-(x2,y2) (a bar enemy's capsule axis) crosses the patch inflated by `pad`. Liang-Barsky. */
export function patchHitsBar(patch: FrescoPatch, x1: number, y1: number, x2: number, y2: number, pad: number): boolean {
  const a = toLocal(patch, x1, y1), b = toLocal(patch, x2, y2);
  const hx = patch.halfLen + pad, hy = patch.halfWid + pad;
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x + hx, hx - a.x, a.y + hy, hy - a.y];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
  }
  return true;
}

// systems/FrescoSystem.ts — shape mirrors OrbitSystem (same 8 constructor params: scene, run, player, enemies group, fx, sfx, damageNumbers, kill). `interface Patch extends FrescoPatch { img; active; age; bitten: Set<number>; }`. Constructor pre-creates POOL = 50 slots like PuddleSystem:
//   { img: scene.add.image(0, 0, TEX.fresco).setOrigin(0.5).setDepth(DEPTH.floor + 1).setAlpha(0).setVisible(false), active: false, x: 0, y: 0, angle: 0, age: 0, halfLen: 0, halfWid: 0, bitten: new Set() }
// Getters activeCount / maxPatches (puddle-pool style) for the invariant. Exact methods:
  update(dt: number, move: Vec2): void {
    const def = this.activeDef(); // WeaponDef|null, found by `w?.fresco` over run.weapons (orbit idiom)
    this.stampTimer -= dt;
    if (def?.fresco && length(move) > 0.2 && this.stampTimer <= 0) {
      this.stamp(def, this.player.x, this.player.y, Math.atan2(move.y, move.x));
      this.stampTimer = def.fresco.stampIntervalSec;
    }
    const lifeSec = def?.fresco?.lifeSec ?? 0;
    for (const p of this.patches) {
      if (!p.active) continue;
      p.age += dt;
      if (lifeSec <= 0 || p.age >= lifeSec) this.despawn(p);
      else p.img.setAlpha(1 - p.age / lifeSec); // texture bakes the starting 0.4 alpha
    }
    if (def?.fresco) this.bite(def);
  }
  private stamp(def: WeaponDef, x: number, y: number, angle: number): void {
    const p = this.takeSlot(); // free slot, else globally oldest (PuddleSystem.findSlot idiom)
    p.active = true; p.x = x; p.y = y; p.angle = angle; p.age = 0;
    p.halfLen = def.look.length / 2; p.halfWid = def.look.width / 2;
    p.bitten.clear();
    p.img.setPosition(x, y).setRotation(angle).setAlpha(1).setVisible(true);
  }
  private bite(def: WeaponDef): void {
    const stats = this.run.stats;
    for (const p of this.patches) {
      if (!p.active) continue;
      for (const obj of this.enemies.getChildren()) {
        const e = obj as Enemy;
        if (!e.active || p.bitten.has(e.serial)) continue;
        if (!this.touches(e, p)) continue;
        p.bitten.add(e.serial);
        const crit = stats.critChance > 0 && this.run.rng.chance(stats.critChance);
        const wound = underexposureDamage(stats.woundThreshold, e.hp, e.maxHp, (crit ? 2 : 1) * def.damage * stats.damageMul);
        const dmg = wound.damage;
        const died = e.hit(dmg, { x: p.x, y: p.y }, def.knockback);
        this.damageNumbers.show(e.x, e.y, dmg, crit, false, wound.doubled);
        this.fx.hit(p.x, p.y, e.def.look.body);
        if (crit) { this.sfx.critHit(); this.fx.critRing(p.x, p.y); } else { this.sfx.hit(); }
        if (died) this.kill(e);
      }
    }
  }
  private touches(e: Enemy, p: Patch): boolean {
    const look = e.def.look;
    if (!look.bar) return patchHitsCircle(p, e.x, e.y, look.radius * e.scaleX);
    const hx = (look.bar.length / 2) * e.scaleX, pad = (look.bar.thickness / 2) * e.scaleX;
    const cx = Math.cos(e.rotation) * hx, cy = Math.sin(e.rotation) * hx;
    return patchHitsBar(p, e.x - cx, e.y - cy, e.x + cx, e.y + cy, pad);
  }
  private despawn(p: Patch): void { p.active = false; p.img.setAlpha(0).setVisible(false); }
```
### Steps
1. `content/types.ts`: add `FrescoSpec` after `ArcSpec` and `fresco?: FrescoSpec;` after `arc?: ArcSpec;` in `WeaponDef`.
2. Create `content/weapons/fresco.ts` (exact object above, import `PALETTE` + `WeaponDef`); in `content/weapons/index.ts` add `import { fresco } from './fresco';` after the counterpoint import and `fresco,` as the last `WEAPONS` entry.
3. `content/upgrades/index.ts`: replace the whole `draft` entry (lines 123-131) in place with the fresco card above.
4. Create `core/fresco.ts` exactly as above.
5. Create `systems/FrescoSystem.ts` (skeleton + exact methods above; imports: `TEX`, `DEPTH`, `WeaponDef`, `WEAPON_BY_ID`, `patchHitsBar`/`patchHitsCircle`/`FrescoPatch` from `core/fresco`, `RunState`, `underexposureDamage`, `length`/`Vec2`, `Enemy`, `Player`, `Sfx`, `DamageNumbers`, `FxSystem`, `Phaser` type-only).
6. `art/textures.ts`: add `fresco: 'fresco'` to `TEX` after `puddle`; in the weapon loop make it `if (weapon.orbit) drawOrbit(scene, weapon); else if (weapon.fresco) drawFresco(scene, weapon); else drawProjectile(scene, weapon);`; add after `drawOrbit`:
```ts
function drawFresco(scene: Phaser.Scene, def: WeaponDef): void {
  const L = def.look.length, W = def.look.width, alpha = def.fresco!.alpha;
  graphicsTexture(scene, TEX.fresco, L + 4, W + 4, (g) => {
    g.fillStyle(PALETTE.ink, alpha);
    g.fillRoundedRect(2, 2, L, W, L / 2);
    g.lineStyle(2, PALETTE.ink, Math.min(1, alpha * 1.5));
    g.strokeRoundedRect(2, 2, L, W, L / 2);
  });
}
```
7. `systems/WeaponSystem.ts` line 52: `if (def.orbit || def.arc || def.fresco) continue; // standing weapons never fire volleys`.
8. `scenes/GameScene.ts`: import `FrescoSystem` before the `FxSystem` import (line 30); field `private fresco!: FrescoSystem;` after `orbit` (line 74); in `create()` after the orbit construction (line 136): `this.fresco = new FrescoSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));`; in `update()` after `this.orbit.update(dt);` (line 177): `this.fresco.update(dt, input.move);`; in `registerInvariants()` after the `puddle-pool` line (375): `hook.addInvariant('fresco-pool', () => (this.fresco.activeCount <= this.fresco.maxPatches ? null : \`${this.fresco.activeCount} fresco patches on screen\`));`.
9. `tests/content.test.ts`: in the weapons "sane numbers" test, after the `w.arc` branch add: `if (w.fresco) { const f = w.fresco; expect(positive(f.stampIntervalSec) && positive(f.lifeSec) && positive(f.maxPatches) && Number.isInteger(f.maxPatches), 'fresco timing and cap > 0').toBe(true); expect(f.alpha > 0 && f.alpha <= 1, 'fresco.alpha in (0, 1]').toBe(true); expect(positive(w.look.length) && positive(w.look.width), 'fresco patch look > 0').toBe(true); return; }`.
10. `tests/core/upgrades.test.ts` line 19: `const maxed = ['contrast', 'vector', 'mass'];`.
11. Create `tests/core/fresco.test.ts` (see Tests). Run `npm run check` then `npm run smoke`.

### Pitfalls
- Forgetting step 7 lets WeaponSystem fire fresco "volleys": speed 0, `lifetimeSec` 0 projectiles with a 10 u body at the muzzle (can still overlap-hit), plus the inkwell fills 10%/s for free.
- Bites silently failing = rotation/axis bug: long axis (halfLen = `look.length`/2 = 9) must follow travel = texture x; `toLocal` is `R(-angle)`. The unit tests pin this — check them first.
- A recycled patch must `bitten.clear()` in `stamp()`, or fresh patches remember old serials and never bite those enemies again.
- Alpha: 0.4 is baked into the texture fill; the system animates image alpha 1→0. Applying 0.4 twice makes the trail read 16%.
- Patches sit at `DEPTH.floor + 1` (puddle layer, under entities), never `DEPTH.fx`.
- No physics body, no velocity: Platen slams, Crop and Tide never touch the trail; stamp timer is dt (seconds) driven by GameScene's clamped dt — no frame counting.
- Keep the `projectileSpeedMul` stat — `WeaponSystem` still multiplies it; only the Draft card is retired.
- Shared-file risk: T0119 (Plumb) also edits the WeaponSystem skip line, `WEAPONS`, `UPGRADES` (retires momentum) and `content/types.ts`; T0126 adds its own trail system to GameScene on this same layer. Keep every edit line-local; on merge, both lines survive.
- The smoke level-up can pick the Fresco card first; `activeDef()` must be null-safe (no-op until owned, including warm-start grant).
- No new SFX/key/HUD/scene: reuse `sfx.hit()`/`critHit()` like CombatSystem.

### Tests
- `tests/core/fresco.test.ts` (new; core/fresco.ts is a new rule a sign flip could silently break): patch = `{x:0,y:0,angle:0,halfLen:9,halfWid:20}`, radius 12 — `patchHitsCircle` hit at (0,0), (20,0), (0,25), (17,28); miss at (25,0), (0,33), (18,29); rotated `angle: Math.PI/2` hit at (0,15), (25,0), miss at (35,0); offset patch `{...patch, x:100, y:-50}` hit at center, miss 30 u away. `patchHitsBar` pad 8: hit (0,-60)→(0,60) and (-60,0)→(60,0); miss (20,-60)→(20,60), hit (15,-60)→(15,60); end-only hit (-5,-40)→(-5,-25), miss (-5,-60)→(-5,-30).
- `tests/content.test.ts` + `tests/core/upgrades.test.ts` updates (step 9-10) keep the 16-card pool validated and drop the dead `draft` reference.
