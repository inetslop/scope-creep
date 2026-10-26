---
id: T0022
title: Add the Arc weapon
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:18:38Z
claimed_at: 2026-10-26T20:34:40Z
---

## Goal
A new weapon: an ink arc that snaps from you toward your aim and chains between nearby enemies — a fast, close-range answer to swarms (Motes, Splinters) that Point and Line plow through too slowly.

## Details
- New weapon "Arc", unlocked the same way as Line and Orbit: a level-up card grants it, and it fires alongside your other owned weapons (there is no weapon switching — everything you own is active at once).
- While owned: every 0.9 s an ink arc snaps from the player toward the aim direction. It hits the first enemy in the aim direction within 260 units, then jumps to the nearest other enemy within 140 units of the enemy it just hit, and so on — up to 3 jumps, so one arc can hit up to 4 enemies. An enemy is hit at most once per arc.
- Each hit deals 16 damage (scales with the damage stat like all weapon damage) and small knockback (40, on the same scale as Line).
- Look: a jagged ink polyline (2–3 zigzag segments per jump) from the player through each chained enemy, fading out over 200 ms. Ink color. It must not hide the player or the shards.
- Sound: reuse the existing shoot SFX on fire.
- New upgrade in `UPGRADES` (same shape as the Line and Orbit entries): `id: 'arc'`, `name: 'Arc'`, `description: 'New weapon: an ink arc that chains between nearby enemies'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.ink`.

## Acceptance criteria
- [ ] The level-up menu offers the Arc upgrade once; picking it makes the player fire ink arcs alongside Point and Line
- [ ] Each arc hits the first enemy in the aim direction within 260 units for 16 damage, then chains to up to 3 more enemies within 140 units of the previous hit, 16 damage each, each enemy at most once per arc
- [ ] Arcs fire every 0.9 s; a jagged ink line flashes from the player through the chained enemies and fades in about 200 ms
- [ ] Enemies killed by the arc drop shards and play the normal death sound; Point and Line behavior is unchanged
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/core/arc.ts` — pure chain-targeting logic (no Phaser imports; lint-enforced)
- create `src/content/weapons/arc.ts` — `arc: WeaponDef` data
- create `src/systems/ArcSystem.ts` — cooldown, hit resolution, jagged ink line (pooled Graphics), fade
- create `tests/core/arc.test.ts` — unit tests for `pickArcTargets`
- edit `src/content/types.ts` — add `ArcSpec` + `arc?: ArcSpec` on `WeaponDef`
- edit `src/content/weapons/index.ts` — import `arc`, append to `WEAPONS`
- edit `src/content/upgrades/index.ts` — add the Arc upgrade entry right after `'orbit'`
- edit `src/systems/WeaponSystem.ts` — one line: skip arc weapons in the volley loop
- edit `src/scenes/GameScene.ts` — construct + update ArcSystem, register invariant
- edit `tests/content.test.ts` — arc branch in the weapons "sane numbers" test
- edit `docs/ARCHITECTURE.md` — extend frame step 4: "WeaponSystem fires volleys; ArcSystem snaps chained arcs on its own cooldown; OrbitSystem..."

### Interfaces
```ts
// src/content/types.ts — new interface (after OrbitSpec) and new WeaponDef field (after `orbit?`)
export interface ArcSpec {
  range: number;      // first-hit search distance from the muzzle, world units
  coneDeg: number;    // FULL cone angle around the aim for the first hit
  maxJumps: number;   // chained jumps after the first hit (hits = maxJumps + 1)
  chainRadius: number; // search radius around the enemy just hit, world units
  fadeMs: number;     // ink line visible duration
}
// WeaponDef gains:  /** Arc weapon (handled by src/systems/ArcSystem); projectile fields unused. */  arc?: ArcSpec;

// src/core/arc.ts
export interface ArcTarget { id: number; x: number; y: number; }
export function pickArcTargets(enemies: readonly ArcTarget[], origin: Vec2, aim: Vec2, range: number, coneDeg: number, chainRadius: number, maxJumps: number): number[];
```
`pickArcTargets` body: first hit = nearest enemy with `d = hypot(e-origin) <= range` and `(dx/d)*aim.x + (dy/d)*aim.y >= Math.cos((coneDeg/2) * Math.PI/180)` (skip `d < 1e-9`). Then loop: push `current.id`, add to `hit` Set; stop when `jumps >= maxJumps`; else `jumps++` and `next` = nearest enemy NOT in `hit` with `hypot(e - current) <= chainRadius`. Return ids in hit order.

### Steps
1. `src/core/arc.ts` — write the function above (imports only `Vec2` from `./vec`).
2. `src/content/weapons/arc.ts` — copy `line.ts`'s shape:
```ts
export const arc: WeaponDef = {
  id: 'arc', name: 'Arc', description: 'A jagged ink bolt that snaps toward your aim and chains between nearby enemies.',
  fireRate: 1 / 0.9, // one arc every 0.9 s
  count: 1, spreadDeg: 0, jitterDeg: 0, // projectile fields unused for arc weapons, required by the type
  damage: 16, speed: 0, lifetimeSec: 0, pierce: 0, knockback: 40,
  look: { length: 4, width: 4, color: PALETTE.ink },
  arc: { range: 260, coneDeg: 30, maxJumps: 3, chainRadius: 140, fadeMs: 200 },
};
```
3. `src/content/weapons/index.ts` — `import { arc } from './arc';` and `WEAPONS = [point, line, orbit, arc]`.
4. `src/content/upgrades/index.ts` — after the `'orbit'` entry:
```ts
  { id: 'arc', name: 'Arc', description: 'New weapon: an ink arc that chains between nearby enemies', maxLevel: 1, weight: 5, mods: [], grantsWeapon: 'arc', color: PALETTE.ink },
```
5. `src/systems/ArcSystem.ts` — model on `OrbitSystem.ts` (same constructor shape: `scene, run, player, enemies, fx, sfx, damageNumbers, kill`). `update(dt, firing)`: find owned def by `w?.arc` field (loop `run.weapons` + `WEAPON_BY_ID`, like `OrbitSystem.activeDef()`); if none, `cooldown = 0; return`. Else mirror `WeaponSystem.update` cooldown idiom exactly: `let cd = this.cooldown - dt; if (firing && cd <= 0) { this.fire(def); cd += 1 / (def.fireRate * this.run.stats.fireRateMul); } this.cooldown = Math.max(cd, 0);`
   `fire(def)`: `aim = fromAngle(this.player.aimAngle)`, `origin = this.player.muzzle()`; build `bySerial: Map<number, Enemy>` + `list: ArcTarget[]` from `this.enemies.getChildren()` (active only); `ids = pickArcTargets(list, origin, aim, spec.range, spec.coneDeg, spec.chainRadius, spec.maxJumps)`. Then for each id: `e = bySerial.get(id); if (!e || !e.active) continue;` — crit roll `stats.critChance > 0 && this.run.rng.chance(stats.critChance)`, `dmg = (crit ? 2 : 1) * def.damage * stats.damageMul`, `died = e.hit(dmg, from, def.knockback)` where `from` starts as `origin` and becomes `{x: e.x, y: e.y}` after each hit; `damageNumbers.show(e.x, e.y, dmg, crit)`; `fx.hit(e.x, e.y, e.def.look.body)`; crit → `sfx.critHit()` + `fx.critRing(e.x, e.y)` else `sfx.hit()`; `if (died) this.kill(e)`; push `from` into `points: Vec2[]` (starts `[origin]`). If `points.length === 1` (whiff) push `origin + aim * spec.range * 0.5`. Then `this.sfx.shoot(); hook.stats.shotsFired += 1; this.draw(points);`
   `draw(points)`: `const pts = this.jagged(points);` then on a pooled `Phaser.GameObjects.Graphics` (pool `readonly lines: Graphics[]`, cap 4, create lazily with `this.scene.add.graphics().setDepth(DEPTH.fx)`, reuse first with `alpha <= 0`, `this.tweens.killTweensOf(line)` before reuse, skip cosmetic if pool full): `line.clear(); line.lineStyle(4, PALETTE.ink, 1); line.beginPath(); line.moveTo(...); line.lineTo(...) per point; line.strokePath(); line.setAlpha(1);` then `this.tweens.add({ targets: line, alpha: 0, duration: spec.fadeMs, ease: 'Linear', onComplete: () => line.clear() })`.
   `jagged(points)`: for each consecutive pair `(a, b)`, insert `segs - 1` interior points where `segs = 2 + (this.run.rng.chance(0.5) ? 1 : 0)` (2–3 zigzag segments per jump), point at `t = s/segs` offset perpendicular by `this.run.rng.range(-16, 16)` (perp = `(-dy, dx)/len`; skip if `len < 1e-6`). Use `run.rng`, never `Math.random`.
6. `src/systems/WeaponSystem.ts` line 33 — `if (def.orbit || def.arc) continue; // orbit and arc weapons never fire volleys`.
7. `src/scenes/GameScene.ts` — import `ArcSystem` (before CombatSystem); field `private arc!: ArcSystem;`; in `create()` after the `this.orbit = ...` line: `this.arc = new ArcSystem(this, this.run, this.player, this.spawns.enemies, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));`; in `update()` after `this.weapons.update(dt, input.firing);` add `this.arc.update(dt, input.firing);`; in `registerInvariants()` add `hook.addInvariant('arc-lines', () => (this.arc.lines.length <= 4 ? null : `${this.arc.lines.length} arc lines alive`));` and add `'arc-lines'` to the `INVARIANTS` array (the existing shutdown handler removes it).
8. `tests/content.test.ts` — in the weapons "sane numbers" test, after the `if (w.orbit) { ... return; }` block add:
```ts
    if (w.arc) {
      const a = w.arc;
      expect(positive(a.range) && positive(a.chainRadius) && positive(a.coneDeg), 'arc range/chain/cone > 0').toBe(true);
      expect(Number.isInteger(a.maxJumps) && a.maxJumps >= 1, 'arc.maxJumps >= 1').toBe(true);
      expect(positive(a.fadeMs), 'arc.fadeMs > 0').toBe(true);
      return;
    }
```
9. `tests/core/arc.test.ts` — import `pickArcTargets` from `'../../src/core/arc'`; with `ORIGIN = {x:0,y:0}`, `AIM = {x:1,y:0}`, range 260, cone 30, chain 140, jumps 3, assert: `[]` → `[]`; `[{1,200,0},{2,100,0},{3,259,0}]` → `[2]` (nearest in cone); `[{1,0,250},{2,300,0}]` → `[]` (off-cone / beyond range); `[{1,100,0},{2,180,0},{3,260,0},{4,340,0},{5,420,0}]` → `[1,2,3,4]` (4th jump excluded); `[{1,200,0},{2,320,0}]` → `[1,2]` (chains from last hit, #2 is 320 from player); `[{1,100,0},{2,120,0}]` → `[1,2]` (no repeat); `[{1,100,0},{2,130,100},{3,200,0}]` → `[1,3,2]` (nearest chain candidate wins).
10. Run `npm run check` then `npm run smoke`.

### Pitfalls
- If WeaponSystem isn't told to skip `def.arc`, the arc also fires as a degenerate speed-0 projectile (muzzle flash + shoot SFX doubled, dead projectiles).
- The content test's projectile checks (`speed > 0`, `lifetimeSec > 0`) run for non-orbit weapons — the arc branch must `return` before them or the build fails.
- Kill mid-chain: `kill()` despawns (disableBody) the enemy; the `hit` set + `e.active` re-check in the damage loop and the `active` filter in targeting prevent double-hits or targeting corpses.
- Reusing a pooled line while its fade tween runs would restart the fade oddly — always `killTweensOf` first. Pool cap 4 is safe: max fireRate 8× gives ~9 arcs/s × 0.2 s fade ≤ 2 concurrent.
- No scene event listeners are added, so no shutdown cleanup beyond the invariant (handled by the `INVARIANTS` array). Graphics/tweens die with the scene.
- Everything dt-based (cooldown) / tween-based (fade) — no 60 fps assumption. No UI changes, so phone 412×915 and 1280×720 layouts are untouched; arc fires on the same `firing` input as Point/Line (touch fire stick works).
- T0014 (also desktop) edits GameScene.ts too — different regions (kill-streak vs arc wiring); if its changes land first, re-locate your insertion points by the anchor lines given in step 7.

### Tests
- new `tests/core/arc.test.ts` (cases listed in step 9); edited `tests/content.test.ts` arc branch. No other unit tests.
