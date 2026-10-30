---
id: T0244
title: "Bolt's volley: every shot goes at the same enemy, one per barrel"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: [T0247]
attempts: 1
created: 2026-10-30T00:51:08Z
claimed_at: 2026-10-30T02:27:06Z
finished_at: 2026-10-30T04:15:35Z
---

## Goal
A tower with extra shots (Bolt added) now fires each shot at a different enemy (`pickTargets` in `src/systems/attacks/shot.ts`). Make it a volley instead: every shot of an attack goes at the same enemy, each from its own barrel, aimed with the sideways offset of that barrel. Extra shots become focused damage on the enemy furthest along, and a tower with pierce, whose shots fly straight, fires parallel lines as wide as its barrels, like a shotgun.

## Details
- **One target per attack:** a shot tower picks one enemy, the one furthest along as now, and fires all its shots at it. With shots 3, it fires three bolts at that enemy.
- **One bolt per barrel, offset like the barrels:** bolt n leaves barrel n's muzzle (`tower.muzzle(n)`, as now) and aims at the target moved sideways by barrel n's offset (perpendicular to the aim). A homing bolt still homes in and hits the target, and the offset only shows as the volley leaving side by side. A bolt that flies straight (a tower with pierce) keeps the offset, so the volley flies as parallel lines.
- **Pulse towers' bolts too:** a pulse tower with extra shots fires its bolts the same way (`src/systems/attacks/pulse.ts`): all at one enemy, the furthest along.
- **Card lines:** Bolt's added line at each rarity says the shots go at the same enemy, keeping that rarity's count, e.g. "One more shot at the same enemy each attack." Bolt's `description` matches.
- **Keep:** targeting picks the furthest-along enemy as now; when the targeting-modes task lands it picks the volley's one target. Damage per bolt, the shot sound (once per volley) and the barrels' look stay the same.

## Acceptance criteria
- [ ] A Bolt tower with two Bolts added fires three bolts per attack, all at the enemy furthest along, each from its own barrel.
- [ ] With Lance added too, the three shots fly as parallel straight lines, offset like the barrels.
- [ ] A pulse tower with extra shots fires all its bolts at one enemy.
- [ ] Bolt's added card line says the shots go at the same enemy, at every rarity.

## Design (architect, cachyos-x8664)

### Files
- `src/systems/attacks/shot.ts` — one target for every shot.
- `src/systems/attacks/pulse.ts` — one target for every bolt.
- `src/entities/Tower.ts` — new `aimOffset(n)`.
- `src/systems/TowerSystem.ts` — fireBolt closure passes the aim offset.
- `src/systems/ProjectileSystem.ts` — `fire()` gains final optional `aim` param.
- `src/entities/Projectile.ts` — stores `aimDX/aimDY`, resets in `fire()`/`firePellet()`, homes to target + offset.
- `src/content/augments/bolt.ts` — card lines.

### Interfaces
- `Tower.aimOffset(n): { x, y }` — board units, perpendicular to the aim, same barrel offset as its muzzle.
- `ProjectileSystem.fire`/`Projectile.fire` gain final optional `aim?: { x: number; y: number }` (the volley's aim point; `undefined` keeps today's flight).
- `core/targeting.pickTarget(x, y, range, enemies): number` (one, `-1` when none) replaces `pickTargets` here; `pickTargets` stays — pulse's splash cap still uses it.

### Steps
1. **shot.ts** — replace the body after `tower.kick()`:
```ts
const t = pickTarget(tower.x, tower.y, range, enemies);
if (t < 0) return false;
const first = enemies[t]!;
tower.aimAt(first.x, first.y);
tower.kick();
for (let n = 0; n < tower.spec.shots; n++) fireBolt(n, first, payload);
sfx?.shoot();
```
(import `pickTarget`; drop `pickTargets`/`targets`.)
2. **pulse.ts** — replace the bolts block with:
```ts
const t = spec.bolts > 0 ? pickTarget(tower.x, tower.y, range, enemies) : -1;
if (t >= 0) {
  const first = enemies[t]!;
  tower.aimAt(first.x, first.y);
  const boltPayload = { ...payload, damage: spec.boltDamage };
  for (let n = 0; n < spec.bolts; n++) fireBolt(n, first, boltPayload);
}
```
(import `pickTarget` alongside `inRange, pickTargets`; wave/hits untouched.)
3. **Tower.ts** — next to `muzzle()`:
```ts
/** Shot n's sideways aim: perpendicular to the aim, the same offset as its muzzle. */
aimOffset(n: number): { x: number; y: number } {
  const offset = this.barrelOffsets.length ? this.barrelOffsets[n % this.barrelOffsets.length]! : 0;
  return { x: Math.cos(this.aim) * offset, y: Math.sin(this.aim) * offset };
}
```
4. **TowerSystem.ts** — closure line 133: `this.projectiles.fire(m.x, m.y, target, payload, spec.projectileSpeed * CELL, false, t.aimOffset(n));`
5. **ProjectileSystem.ts** — `fire(x, y, target, payload, speed, asTracer = false, aim?: { x: number; y: number })`; forward it: `this.take().fire(x, y, target, payload, speed, asTracer, aim);` (the pierce re-fire at line 94 passes none → straight as today.)
6. **Projectile.ts** — add `private aimDX = 0; private aimDY = 0;`. In `fire()`: take the param, set `this.aimDX/aimDY` (default 0), and aim the first vector at `target + (aimDX, aimDY)` (the existing `d > 0` block, offsets added to each numerator). In `firePellet()`: reset both to 0. In `advance()`: `const dx = t.x + this.aimDX - this.x; const dy = t.y + this.aimDY - this.y;` (landing check and `land()` untouched — `land()` strikes by reference, so the enemy is always hit.)
7. **bolt.ts** — `description: 'Shoots the enemy furthest along. Added: one more shot at the same enemy each attack.'`, `asAdded: 'One more shot at the same enemy each attack.'`, `tiers.rare.asAdded` and `tiers.epic.asAdded` the same line.

### Pitfalls
- Pooled projectile: `fire()` must reset `aimDX/aimDY` (and `firePellet()` too), or a recycled Spray pellet inherits a stale offset.
- Barrel index wraps past 4 (`n % barrelOffsets.length`) — same as `muzzle()`.
- `sfx?.shoot()` once per volley, damage per bolt, `shotsFired` +1 per attack — unchanged.
- Don't touch pierce re-fire in `land()` (T0247 makes shots fly straight); beam towers never reach `fireBolt`.
- New tier line is 43 chars — inside `tests/content.test.ts` caps (≤56, no `first|added|alone` prefix).

### Tests
None added: no core rule changes (`pickTarget` is covered by `tests/core/targeting.test.ts`), card lines are validated by `tests/content.test.ts`. Gate on `npm run check` + `npm run smoke`.

## Result (attempt 1, desktop-4070)

Autocompact is thrashing: the context refilled to the limit within 3 turns of the previous compact, 3 times in a row. A file being read or a tool output is likely too large for the context window. Try reading in smaller chunks, or use /clear to start fresh.

- Self-review: APPROVE
- Time: 108.5 min

```
.../chokepoint/game/src/content/augments/bolt.ts   |  8 ++++----
 .../chokepoint/game/src/entities/Projectile.ts     | 23 +++++++++++++++-------
 projects/chokepoint/game/src/entities/Tower.ts     |  6 ++++++
 .../game/src/systems/ProjectileSystem.ts           |  6 +++---
 .../chokepoint/game/src/systems/TowerSystem.ts     |  2 +-
 .../chokepoint/game/src/systems/attacks/pulse.ts   | 12 +++++------
 .../chokepoint/game/src/systems/attacks/shot.ts    | 12 +++++------
 7 files changed, 42 insertions(+), 27 deletions(-)
```
