---
id: T0119
title: The Plumb weapon — the blade that hangs at your aim
assignee: desktop-4070
size: M
priority: 2
status: todo
depends_on: [T0100]
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
A new level-up card that changes how you aim: a thin ink line hangs from the top of the page at your aim's X and re-aims instantly, biting everything that crosses it — a standing wall you place with your aim, in the line of the other weapon cards (Line, Orbit, Arc, Counterpoint).

## Details
- The card: "Plumb" — ink-colored, weight 4, maxLevel 1, like the other weapon cards. One line of card text does the teaching: "A thin ink line hangs at your aim and bites what crosses it." The line is self-evident the moment it appears.
- The line: a thin (2 u wide) ink line hangs from the top edge of the crop-safe area straight down to the bottom edge at your aim's X. It follows the aim instantly every frame — no firing, no cooldown, no projectile. It stays inside the crop-safe area, so it follows the T0045 shrink and never extends into the cropped margin.
- The bite: an enemy whose body crosses the line takes 12 damage once per 0.5 s per enemy (a steady bite, not a per-frame burn) with the normal hit flash, and is shoved 60 units horizontally away from the line (a small knock in the existing knockback idiom). The line never hurts the player. Bosses bite the same as any other enemy — a slow bleed while you focus.
- It eats fire: an enemy bullet that touches the line is destroyed, with a small flat ink ring where it dies (reuse the existing ring FX).
- It composes like the other weapon cards: picking it adds it to your kit — your Point volleys keep firing normally (the Plumb is a standing weapon like the Orbit, not a volley). It shows in The Index (T0104) as a normal pick and, at maxLevel 1, is never offered again (the existing rule).
- Pool: the upgrade pool is 16/16 at the cap, so this task also removes the Momentum card (+12% move speed) from `UPGRADES` — Plumb in, Momentum out, the pool stays exactly 16. Momentum is the least decision-changing of the stat cards (see the pool note in IDEAS.md). If a unit test names `momentum` by id (upgrade-roll, stat-stacking or spawn tests), update it in the same task so the suite stays green; no other card's numbers change.
- No new input, no new HUD element, no new scene, no new sound.

## Acceptance criteria
- [ ] "Plumb" appears as a level-up card (ink, weight 4, maxLevel 1); picking it adds a thin ink line hanging from the top of the crop-safe area at your aim's X that follows the aim instantly, and it is listed in The Index.
- [ ] An enemy crossing the line takes 12 damage once per 0.5 s with the normal hit flash and a small 60-unit horizontal shove; the player is never hurt by the line; enemy bullets that touch the line are destroyed.
- [ ] Your Point volleys keep firing normally; the card is never offered a second time; a Warm Start (T0114) can draw it like any other card.
- [ ] The upgrade pool has exactly 16 cards: Momentum is gone (never offered, never drawn) and Plumb is in; the existing upgrade-roll, spawn and stat-stacking tests stay green (updated in the same task where they name momentum).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/content/weapons/plumb.ts` — the Plumb WeaponDef (data only, mirror `arc.ts`)
- create `src/systems/PlumbSystem.ts` — the standing-weapon system (model on `OrbitSystem.ts`)
- edit `src/content/types.ts` — add `PlumbSpec` interface and a `plumb?` field on `WeaponDef`
- edit `src/content/weapons/index.ts` — import `plumb` and append it to `WEAPONS` (one item per line, after `counterpoint`)
- edit `src/content/upgrades/index.ts` — replace the `momentum` entry **in place** (same slot) with the `plumb` entry; pool stays 16
- edit `src/systems/WeaponSystem.ts` — one line: skip plumb in the volley loop
- edit `src/systems/BossSystem.ts` — add public method `biteBoss()` (boss damage bookkeeping lives here; PlumbSystem must not touch the boss directly)
- edit `src/scenes/GameScene.ts` — 5 small insertions, each beside the orbit/arc equivalent (import, field, construction, update call, invariant)
- edit `tests/content.test.ts` — weapons "sane numbers" test: add a `w.plumb` branch (else `speed: 0` fails the volley checks)
- edit `docs/ARCHITECTURE.md` — extend the step-4 sentence with PlumbSystem (a different line than T0100's edits; re-check on merge)

### Interfaces
```ts
// content/types.ts — new interface after ArcSpec; on WeaponDef after `arc?: ArcSpec;`:
export interface PlumbSpec {
  /** Line thickness in world units (2). */
  lineWidth: number;
  /** Per-target immunity after a bite (0.5). */
  biteCooldownSec: number;
}
// WeaponDef gains:
  /** Plumb weapon (handled by src/systems/PlumbSystem); projectile fields unused. */
  plumb?: PlumbSpec;

// systems/PlumbSystem.ts — public surface:
export class PlumbSystem {
  constructor(scene: Phaser.Scene, run: RunState, player: Player, enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: BossSystem, fx: FxSystem, sfx: Sfx, damageNumbers: DamageNumbers, kill: (e: Enemy) => void);
  get active(): boolean;   // true while the player owns the plumb weapon
  get lineX(): number;     // line X at last update; NaN while inactive (the invariant reads both)
  update(_dt: number): void;
}

// systems/BossSystem.ts — public, insert right before the private `onProjectileHit`:
biteBoss(damage: number, x: number, y: number): void;
```

### Steps
1. `content/types.ts`: add `PlumbSpec` and the `plumb?` field.
2. `content/weapons/plumb.ts`:
```ts
export const plumb: WeaponDef = {
  id: 'plumb',
  name: 'Plumb',
  description: 'A thin ink line hangs at your aim and bites what crosses it.',
  fireRate: 1,
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0, // projectile fields unused for standing weapons, required by the type
  damage: 12,
  speed: 0,
  lifetimeSec: 0,
  pierce: 0,
  knockback: 60,
  look: { length: 2, width: 2, color: PALETTE.ink },
  plumb: { lineWidth: 2, biteCooldownSec: 0.5 },
};
```
3. Register in `content/weapons/index.ts`. In `content/upgrades/index.ts` replace the whole `momentum` object with `{ id: 'plumb', name: 'Plumb', description: 'A thin ink line hangs at your aim and bites what crosses it.', maxLevel: 1, weight: 4, mods: [], grantsWeapon: 'plumb', color: PALETTE.ink }`.
4. `WeaponSystem.ts` line 52: `if (def.orbit || def.arc || def.plumb) continue;` (standing weapons never fire volleys).
5. `BossSystem.ts` `biteBoss` (mirrors `onProjectileHit`'s bookkeeping minus pierce/crit/knockback — bosses never crit and BossSystem overwrites boss velocity every frame, so no shove):
```ts
biteBoss(damage: number, x: number, y: number): void {
  const b = this.boss;
  if (!b.active) return;
  const wound = underexposureDamage(this.run.stats.woundThreshold, b.hp, b.maxHp, damage);
  const died = b.hit(wound.damage);
  this.run.bossHp = Math.max(0, b.hp);
  this.damageNumbers.show(b.x, b.y, wound.damage, false, false, wound.doubled);
  this.fx.hit(x, y, PALETTE.ink);
  this.sfx.hit();
  if (this.def.behavior === 'palette') { this.onSwatchHit(this.def, died); return; }
  if (died) this.killBoss();
}
```
6. `src/systems/PlumbSystem.ts` — full logic. Imports: `type Phaser` from 'phaser'; `Sfx`; `ARENA_SIZE, DEPTH`; `PALETTE`; `WeaponDef` (type); `WEAPON_BY_ID`; `cropSafeFraction`; `RunState` (type); `underexposureDamage`; `fromAngle`; `Enemy, EnemyBullet, Player` (types); `BossSystem, DamageNumbers, FxSystem` (types). Fields: the constructor params (readonly) plus `private readonly g: Phaser.GameObjects.Graphics` created via `scene.add.graphics().setDepth(DEPTH.projectiles).setVisible(false)`, `private readonly lastBite = new Map<number, number>()`, `private x = NaN`. `get active()` returns `this.activeDef() !== null`; `get lineX()` returns `this.x`; `private activeDef()` scans `this.run.weapons` via `WEAPON_BY_ID` and returns the def with `w?.plumb` (found by field, not id — orbit idiom). `update(_dt)`:
```ts
const def = this.activeDef();
const spec = def?.plumb;
if (!def || !spec) { this.x = NaN; this.g.clear().setVisible(false); return; }
const safeHalf = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
const x = this.lineXAt(safeHalf);
this.x = x;
const g = this.g;
g.clear();
g.lineStyle(spec.lineWidth, PALETTE.ink, 1);
g.lineBetween(x, -safeHalf, x, safeHalf);
g.setVisible(true);
const now = this.scene.time.now;
const cooldownMs = spec.biteCooldownSec * 1000;
const halfLine = spec.lineWidth / 2;
for (const [serial, t] of this.lastBite) if (now - t > cooldownMs) this.lastBite.delete(serial); // keep the map tiny
for (const obj of this.enemies.getChildren()) {
  const e = obj as Enemy;
  if (!e.active) continue;
  if (Math.abs(e.x - x) > e.def.look.radius * e.scaleX + halfLine) continue;
  if (e.def.look.bar && !e.hitTestPoint(x, e.y, halfLine)) continue; // precise capsule gate
  const last = this.lastBite.get(e.serial);
  if (last !== undefined && now - last < cooldownMs) continue; // one bite per enemy per 0.5 s
  this.lastBite.set(e.serial, now);
  const crit = this.run.stats.critChance > 0 && this.run.rng.chance(this.run.stats.critChance);
  const wound = underexposureDamage(this.run.stats.woundThreshold, e.hp, e.maxHp, (crit ? 2 : 1) * def.damage * this.run.stats.damageMul);
  const dmg = wound.damage;
  const died = e.hit(dmg, { x, y: e.y }, def.knockback); // from sits on the line at the enemy's height: the shove is horizontal
  this.damageNumbers.show(e.x, e.y, dmg, crit, false, wound.doubled);
  this.fx.hit(x, e.y, e.def.look.body);
  if (crit) { this.sfx.critHit(); this.fx.critRing(x, e.y); } else { this.sfx.hit(); }
  if (died) this.kill(e);
}
for (const obj of this.enemyShots.getChildren()) {
  const s = obj as EnemyBullet;
  if (!s.active) continue;
  if (Math.abs(s.x - x) <= 6 + halfLine) { // EnemyBullet bodies are radius 6
    this.fx.critRing(s.x, s.y);
    s.despawn();
  }
}
const b = this.boss.boss;
if (b.active) {
  const body = b.body as Phaser.Physics.Arcade.Body;
  const crosses = Math.abs(b.x - x) <= body.halfWidth + halfLine && b.y + body.halfHeight >= -safeHalf && b.y - body.halfHeight <= safeHalf;
  const last = this.lastBite.get(b.serial);
  if (crosses && (last === undefined || now - last >= cooldownMs)) {
    this.lastBite.set(b.serial, now);
    this.boss.biteBoss(def.damage * this.run.stats.damageMul, x, b.y);
  }
}
```
and:
```ts
/** Where the aim ray meets the top of the safe area, clamped inside it. */
private lineXAt(safeHalf: number): number {
  const a = fromAngle(this.player.aimAngle);
  if (Math.abs(a.y) < 1e-3) return a.x >= 0 ? safeHalf : -safeHalf; // aiming level: line pins to the aimed side
  const x = this.player.x + (-safeHalf - this.player.y) * (a.x / a.y);
  return Math.min(safeHalf, Math.max(-safeHalf, x));
}
```
7. `GameScene.ts` insertions: import after the `OrbitSystem` import; `private plumb!: PlumbSystem;` after `private arc!: ArcSystem;`; after the arc construction: `this.plumb = new PlumbSystem(this, this.run, this.player, this.spawns.enemies, this.spawns.enemyShots, this.boss, this.fx, this.sfx, this.damageNumbers, (e) => this.combat.killEnemy(e));`; in `update()` after `this.orbit.update(dt);` add `this.plumb.update(dt);`; in `registerInvariants()` after the `orbit-circles` invariant add `hook.addInvariant('plumb-line', () => (!this.plumb.active || Number.isFinite(this.plumb.lineX) ? null : \`plumb line at x=${this.plumb.lineX}\`));`.
8. `tests/content.test.ts`: in the weapons "sane numbers" test, after the `if (w.arc) { ... }` block add `if (w.plumb) { expect(positive(w.plumb.lineWidth), 'plumb lineWidth > 0').toBe(true); expect(positive(w.plumb.biteCooldownSec), 'plumb biteCooldownSec > 0').toBe(true); return; }`.
9. `docs/ARCHITECTURE.md` step 4: append `; \`PlumbSystem.update\` re-aims the plumb line at the aim's X and bites what crosses it (enemies, enemy bullets, boss)`.
10. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Missing the `WeaponSystem` skip = plumb fires 0-speed volleys (drains the pool/inkwell, inflates shotsFired). Do step 4.
- Missing the `content.test.ts` branch = suite red on `speed: 0`. Do step 8.
- Never touch the boss from PlumbSystem directly — only `boss.biteBoss()`, or a Palette swatch can die without `onSwatchHit` (broken cascade, desynced `run.bossHp`, no kill).
- No boss shove: `Boss.hit` takes no knockback and BossSystem sets boss velocity every frame, so a shove would be nullified — the boss bleeds, which is what the task means.
- Use `cropSafeFraction(run.timeSec)`, never a hardcoded `ARENA_SIZE / 2` — the line must shrink with the T0045 crop and stay out of the margin.
- Guard the horizontal-aim division (`|a.y| < 1e-3`) — otherwise `lineX` is ±Infinity/NaN and the invariant fires. `normalize` already returns (0,0) for a zero vector, so an enemy centered exactly on the line shoves 0 without NaN.
- Use `e.scaleX` in the enemy gate (orbit omits it — that underestimates elite radius; don't copy that).
- `g.clear()` before every redraw — `lineBetween` strokes immediately with the current style; a stale long line would linger when the crop shrinks.
- Keep the `lastBite` stale-entry sweep (serials are never reused for live enemies, but the map must stay tiny); the boss shares the map — its serial changes per spawn, so the cooldown resets per swatch/boss correctly.
- No scene listeners in PlumbSystem → nothing to remove on shutdown; the Graphics dies with the scene like orbit's images.
- `update(_dt)` — the parameter is unused (cooldowns use `scene.time.now`, orbit idiom); the underscore prefix is the repo's lint convention.
- The Index (pause PICKS column), LevelUp cards and Warm Start draws are all generic over `UPGRADES`/`UPGRADE_BY_ID` — no edits needed there. No test names `momentum` (verified), so no test update beyond step 8.

### Tests
None — no `src/core` rule is added or changed (the step-8 `content.test.ts` branch is the required content-validation edit for the new weapon shape).
