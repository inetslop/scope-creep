---
id: T0004
title: "Lance: a piercing line augment"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T01:07:07Z
---

## Goal
A new augment with an attack no tower has: a thin shot that keeps going after a hit and strikes more enemies in its line.

## Details
- New augment, closest existing: Bolt (straight single-target shot). What is new: piercing — the shot passes through enemies instead of stopping at the first one.
- As a tower's first augment: "Lance — a long thin shot, 12 damage every 0.9s, hits one more enemy beyond." A thin straight tracer (teal, ~2px wide) with the normal hit flash. Targeting is the same as Bolt's (furthest along).
- When added to a tower: "Added: +1 pierce" — the tower's shots pass through one more enemy after the first hit. It combines with every first augment:
  - Bolt + Lance: shots hit 2 in a line
  - Reach + Lance: a piercing sniper, 2 in a line
  - Rapid + Lance: needles each pass through 1 more enemy
  - Splash + Lance: the shot passes through 1 more enemy before it bursts
  - Frost + Lance: a slowing shot that hits 1 more enemy
- Tiers (E4, T0002): Common 12 damage / 0.9s / pierce 1; Rare 16 / 0.77s / pierce 2; Epic 20 / 0.63s / pierce 3. If the rarity system has not landed when this is built, the Common values are the live ones and Rare/Epic are stored in the augment's data for it to read later.
- On the tower: a long thin teal rod barrel (about 2x the length of a standard barrel, about 1/3 of its width) that points at the target. If teal is already used by another augment, use green instead.
- Draft card lines (Common): "Lance — a long thin shot, 12 damage every 0.9s, hits one more enemy beyond." / "Added: +1 pierce."

## Acceptance criteria
- [ ] A lone Lance tower in a line of 3 Dots takes the line down with a single shot hitting 2 (the target and the one beyond).
- [ ] A Bolt tower with Lance in a second slot hits 2 enemies in a line per shot.
- [ ] The draft offers Lance with both card lines; a tower with it shows the long thin rod.
- [ ] Pierced enemies take the full damage each (3 Dots in a line: 2 die, the third takes no hit from that shot).
- [ ] The rod barrel is visible at 1x zoom at 412x915 and does not overlap the board's road.

## Design (architect, desktop)

- Pierce is a **payload/projectile property, not a new attack kind**: the existing `shot`/`pulse` attacks stay untouched; `ProjectileSystem` re-targets a landed bolt to the closest enemy *behind* it on the path (a "line" of enemies), which makes the mechanic always useful on the winding road (a purely geometric line would almost never cross a second enemy).
- The road is `CELL * 0.58` wide, so its edge sits ~45 units from an adjacent tower center — a rod at length-factor 1.4 (tip ≤ ~36 from the body, including the 4-unit body lift) clears it, while its *visible* part is ~2x a standard barrel's visible part.
- `teal` is Bolt's color and the task's fallback `green` is Reach's; the tracer must be teal, so Lance takes teal + the unused `square` shape.
- The existing content test caps card lines at 56 chars — the task's quoted line (67) must be trimmed exactly.
- The existing DPS test (`min > 12`, `max/min < 2`) still passes with Lance's 12 × 1.11 = 13.3.
- T0002 (rarity) hasn't landed, so Common values are live and Rare/Epic are stored in the augment file as a local const per the task.

DESIGN:
### Files
- create `src/content/augments/lance.ts` - Lance augment + tier numbers (below)
- edit `src/content/types.ts` - `pierce?: number` field in `AddedForm`, after the `splash` field
- edit `src/content/augments/index.ts` - `import { lance } from './lance';` (between frost and rapid imports) and `lance,` after `bolt,` in `AUGMENTS`
- edit `src/core/targeting.ts` - new `pickPierceTarget()` after `pickTargets`
- edit `src/config.ts` - `export const PIERCE_REACH = 3;` right after the `CELL` line, comment: cells behind the last hit a piercing shot keeps striking
- edit `src/core/augments.ts` - `pierce: number` in `TowerSpec` (after `splash`) and `pierce: 0` in `EMPTY`; in the added-loop `spec.pierce += e.pierce ?? 0;` after the splash line; in the pulse branch `spec.bolts += spec.pierce;` (a pulse given pierce fires that many bolts, which keep going); in `describeSpec`'s shot branch append `` `, and each hits ${spec.pierce + 1} in a line` `` when `spec.pierce > 0`
- edit `src/systems/EnemySystem.ts` - `pierce: number` in `HitPayload` after `slow`
- edit `src/systems/TowerSystem.ts` - add `pierce: spec.pierce,` to the attack `payload`
- edit `src/entities/Projectile.ts` - tracer texture, rotation, `age` (below)
- edit `src/art/textures.ts` - `export const TRACER_TEXTURE = 'fx:tracer';` after `BOLT_TEXTURE`
- edit `src/art/entities.ts` - in `paintEntityTextures`, after the bolt paint: `paintTexture(scene, TRACER_TEXTURE, 4, 16, (ctx) => { roundRectPath(ctx, 0.25, 2, 3.5, 12, 1.75); ctx.fillStyle = '#ffffff'; ctx.fill(); });` (+ import)
- edit `src/systems/ProjectileSystem.ts` - `land()` re-targeting + `brokenProjectile()` (below)
- edit `src/entities/towerLook.ts` - rod in `barrelLook()` (below)
- edit `src/debug/runChecks.ts` - `['projectiles.stuck', (g) => g.projectiles.brokenProjectile()],` after the `projectiles.count` line
- edit `tests/core/targeting.test.ts`, `tests/core/augments.test.ts` - tests (below)

### Interfaces
```ts
// content/types.ts, in AddedForm:
pierce?: number; // shot strikes this many more enemies behind the one it hit; a pulse fires that many bolts per pulse

// core/targeting.ts: index of the closest ACTIVE enemy strictly behind `behind` on the path
// (smallest gap `behind.distance - e.distance`), only gaps > 0 and <= maxBehind; skip `e === behind`; -1 when none
export function pickPierceTarget(behind: TargetCandidate, enemies: readonly TargetCandidate[], maxBehind: number): number;

// core/augments.ts TowerSpec + systems/EnemySystem.ts HitPayload:
pierce: number; // how many more enemies a shot strikes after the first hit; 0 = none

// systems/ProjectileSystem.ts:
brokenProjectile(): string | undefined; // an active projectile with age > 5 is stuck
```
`lance.ts` in full: `id: 'lance'`, `name: 'Lance'`, `description: 'A long thin shot that keeps going. Added: +1 pierce.'`, `asTower: 'A long thin shot: 12 damage every 0.9s, hits one beyond.'` (exactly 56 chars — the content test's limit), `asAdded: '+1 pierce.'`, `look: { shape: 'square', color: 'teal', size: 0.22 }`, `first: { kind: 'shot', damage: 12, range: 2.6, rate: 1.11, projectileSpeed: 10 }`, `added: { pierce: 1 }`, plus `export const LANCE_TIERS = [{ damage: 12, rate: 1.11, pierce: 1 }, { damage: 16, rate: 1.3, pierce: 2 }, { damage: 20, rate: 1.59, pierce: 3 }] as const;` (rare/epic for T0002; if T0002's tiers.ts has landed first, store them in that shape instead and drop this const).

### Steps
1. Do the Files above in order: content (types, lance, registry) → core (targeting, config, augments) → systems (EnemySystem, TowerSystem) → entities/art (Projectile, textures, entities, ProjectileSystem) → towerLook → runChecks → tests.
2. `Projectile.ts`: add `age = 0;`; in `fire()` add `this.age = 0; this.setRotation(0);`, then `const tracer = payload.pierce > 0; this.setTexture(tracer ? TRACER_TEXTURE : BOLT_TEXTURE);` and `artScale(this, !tracer && payload.splash > 0 ? 1.4 : 1);`; in `advance()` add `this.age += dt;` and, after dx/dy are computed: `if ((this.payload?.pierce ?? 0) > 0) this.setRotation(Math.atan2(dx, -dy));` (tracer points where it flies; the texture is flat, so rotating is allowed).
3. `ProjectileSystem.ts`: imports `CELL, PIERCE_REACH` from config and `pickPierceTarget`; `update()`'s `if (p.advance(dt))` becomes `this.land(p)`; 
```ts
private land(p: Projectile): void {
  const target = p.target!;
  const payload = p.payload!;
  const next = payload.pierce > 0 ? pickPierceTarget(target, this.enemies.all, PIERCE_REACH * CELL) : -1;
  if (next < 0) { this.enemies.hit(target, payload); p.despawn(); return; }
  const x = target.x, y = target.y;
  this.enemies.strike(target, payload); // no burst yet: the shot keeps going
  p.fire(x, y, this.enemies.all[next]!, { ...payload, pierce: payload.pierce - 1 }, p.speed);
}
```
4. `barrelLook()` in `towerLook.ts`: compute `const rod = spec.pierce > 0;` and return `length: rod ? 1.4 : <existing clamp>`, `width: rod ? 0.34 : <existing clamp>`; keep `bulb: spec.splash > 0` and `bands: speedUps(spec)`. The existing round-rect painter already draws a thin capsule at these factors — no art code change; the texture key is cached on demand.
5. Run `npm run check` then `npm run smoke`; both must pass.

### Pitfalls
- Never mutate the attack's `payload`: the same object feeds every bolt of one attack; always re-fire with a fresh `{ ...payload, pierce: n - 1 }`.
- Reset every field in `fire()` (texture, rotation, age, scale) — pooled bolts switch between tracer and dot.
- Splash bursts at the END of the line: intermediate hits use `enemies.strike()` (no ring), only the final `enemies.hit()` bursts.
- Rod length is fixed 1.4 regardless of range — a range-scaled rod (2.0 for Reach) would reach 49 units from the body, past the road's 45-unit edge.
- Pick the next enemy BEFORE striking the target, and capture `x, y` before the strike.
- Don't round the rate below ~1.1 or the existing "similar damage per second" test in tests/core/augments.test.ts fails (min must stay > 12).
- The tracer is teal because the payload color is the tower's first-augment color; keep `color: 'teal'` and distinguish the tower body with the unused `square` shape (green, the task's fallback, is Reach's color).

### Tests
- tests/core/targeting.test.ts: `pickPierceTarget` — closest active enemy behind; skips the hit enemy itself, inactive, and ahead; gap == maxBehind is included, bigger is not; -1 when nothing behind.
- tests/core/augments.test.ts: `spec('lance').pierce` is 1 and kind 'shot'; `spec('bolt','lance').pierce` 1; `spec('lance','lance').pierce` 2; `spec('frost','lance')` gives `bolts` 1 and `pierce` 1.
