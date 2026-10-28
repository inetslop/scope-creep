---
id: T0038
title: "Ricochet: the shot that bounces off the board's rocks"
size: L
priority: 3
status: failed
depends_on: []
attempts: 0
created: 2026-10-28T09:35:22Z
finished_at: 2026-10-28T21:08:10Z
epic: E4
---

## Goal
The board's shape joins the fight: the draft can roll a new augment, Ricochet — a shot that deflects off the board's rocks and strikes the enemy behind them. Every run is a new board; with Ricochet, that board is something to build around, not just look at.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Bolt (a straight shot at the furthest). **What is new:** the board's rocks take part in the attack — the first augment that uses the board's shape in combat; a shot that would cross a rock deflects off it and can strike an enemy the tower cannot reach directly.
- **As a tower's first augment (its own attack):** a mid-tempo shot at the enemy furthest along. Common: 7 damage every 0.8 s. Rare: 9 every 0.7 s. Epic: 12 every 0.6 s. Range 4.5 cells (mid-long: longer than a Bolt's, shorter than Reach's common). If the shot's path crosses a rock before reaching the target, it bounces off that rock once — a true deflection off the rock's round face, no damage to the rock, a small white pop at the impact point — and continues straight until it strikes the first enemy it touches. With no rock in the way it is a plain shot at the target.
- **A bounced strike is a normal hit:** full per-hit damage, plus the per-hit effects of any other augments in the tower (Frost added slows the struck enemy, Ember added ignites it, a Marked struck enemy pays +25%). The deflected shot strikes the first enemy it touches and stops — no piercing (that is Lance's).
- **When added to a tower:** the tower's shots bounce off one more rock per Ricochet — a shot bounces off up to N rocks, N = the Ricochets in the tower (a lone Ricochet tower bounces once; a Bolt with one Ricochet in a later slot bounces once, with two Ricochets twice). After the last allowed bounce the shot strikes the first enemy it touches, or fizzles in a small white puff if it meets none.
- **No falloff:** the shot deals the same damage after a bounce as before it; rocks are never damaged, moved or consumed.
- **Card lines:** first: "Shots bounce off a rock and hit the enemy behind." — the per-tier damage and rate (7 / 0.8 s, 9 / 0.7 s, 12 / 0.6 s) show on the card's numbers line the way Bolt's numbers do. Added: "Shots bounce off one more rock."
- **The tower-panel line** (the same place Ember's and Mark's live): a Ricochet tower reads "Shots bounce off a rock: 7 damage, every 0.8 s" with its tier's numbers; a tower with Ricochet added appends ", and its shots bounce off N rocks".
- **Look on the tower:** a body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight or queued augment, take the next free one). Ricochet first: the barrel ends in a small angled arrowhead tip, kinked as if the shot has already turned. Every Ricochet added to another tower: one small tick near that tower's barrel tip in Ricochet's color. If T010's tier pips have landed, they stay visible — the ticks never sit on top of the pips.
- **Sound:** one new Sfx method, a short soft "tink" (a high blip at the soft UI-blip volume, never above the hit blip), played once per rock a shot deflects off; a shot that meets no rock, and the fizzle, are silent.
- **Spec-test coverage** (close to the projectile tests): bounce count equals the Ricochet copies (1 for a Ricochet tower, +1 per added), no damage falloff over bounces, no rock ever takes damage, the added form through a Bolt tower, the fizzle (a deflected shot with no enemy behind the rock strikes nothing and despawns cleanly), and the card lines per tier. One invariant line in the debug run checks next to the other projectile invariants (no live shot with more bounces than its source tower's Ricochet copies).
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Ricochet as Common, Rare and Epic (frame and gem row per T0002, name line per T0026); the card shows that tier's damage and rate; the added line reads "Shots bounce off one more rock."
- [ ] A lone Common Ricochet tower fires 7 damage at the enemy furthest along every 0.8 s; with no rock in the way the shot behaves like a plain shot.
- [ ] With a rock between tower and target, the visible shot deflects off the rock (a small white pop at the impact, one soft tink) and strikes the first enemy it touches behind it for full damage.
- [ ] A bounced strike is a normal hit: a Ricochet tower with Frost added slows the struck enemy, and a struck marked enemy dies faster than the same unmarked one (Mark's +25%).
- [ ] A second Ricochet in a tower lets its shots bounce off two rocks in one flight; the tower shows one Ricochet tick per copy and the tower panel says the shots bounce off 2 rocks.
- [ ] Damage never drops after a bounce; rocks are never damaged, moved or consumed; a deflected shot that meets no enemy fizzles in a small white puff.
- [ ] A first-time player can read it from the board alone: the deflection is visible mid-flight, and the struck enemy is the one behind the rock.

## Design (architect, desktop)

### Files
- create `src/content/augments/ricochet.ts` — the augment def (exact object in Steps)
- create `src/core/rocks.ts` — pure (no Phaser): the board's rocks as circles, segment→rock hit, direction reflection
- create `tests/core/rocks.test.ts` — unit tests for rocks.ts
- edit `src/content/augments/index.ts` — add `ricochet,` directly after `bolt,`
- edit `src/content/types.ts` — `bounces?: number;` in `FirstForm` (after `projectileSpeed`) and in `AddedForm` (after `rangeMul`), each with a one-line comment
- edit `src/core/augments.ts` — `TowerSpec`/`EMPTY` gain `bounces: number`; `towerSpec` inits `bounces: f.bounces ?? 0` and adds `spec.bounces += e.bounces ?? 0;` in the loop after the `extraShots` line; `describeSpec` shot branch gets the ricochet line (below)
- edit `src/systems/Board.ts` — `readonly rocks: Rock[]` set once in the constructor from `rockList(this.map)`
- edit `src/entities/Projectile.ts` — `RicochetFlight` type, bounce fields, `fire()` resets, `lost` guard, `advance` split into homing/ricochet
- edit `src/systems/ProjectileSystem.ts` — `fire()` takes `flight`, `update()` handles `'hit'`/`'fizzle'`, new `brokenBounce()`
- edit `src/systems/TowerSystem.ts` — only the `fireBolt` closure in `attack()` passes the `RicochetFlight`
- edit `src/systems/FxSystem.ts` — new `pop()`; edit `src/audio/Sfx.ts` — new `tink()`
- edit `src/art/barrels.ts` — `BarrelLook` gains `arrow`/`ticks`, in the texture key; arrowhead tip + Ricochet-colored ticks
- edit `src/entities/towerLook.ts` — `barrelLook()` sets `arrow`/`ticks` from the spec
- edit `src/scenes/menu/MenuDemo.ts` — its inline `BarrelLook` literal at line 70 gains `arrow: false, ticks: 0`
- edit `src/debug/runChecks.ts` — one invariant line after `projectiles.count`; edit `tests/core/augments.test.ts` — ricochet tests + widen the DPS bounds (below)

### Interfaces
```ts
// core/rocks.ts (pure)
export interface Rock { x: number; y: number; r: number }
export interface RockHit { index: number; x: number; y: number; nx: number; ny: number; t: number } // t: 0..1 along the segment; n: unit normal from rock center
export function rockList(map: GameMap): Rock[]
export function firstRockHit(sx: number, sy: number, ex: number, ey: number, rocks: readonly Rock[], skip: readonly number[]): RockHit | undefined
export function reflectDir(dx: number, dy: number, nx: number, ny: number): { x: number; y: number }
// entities/Projectile.ts
export interface RicochetFlight { bounces: number; rocks: readonly Rock[]; enemies: readonly Enemy[]; bounds: { w: number; h: number }; fx: FxSystem; sfx: Sfx | undefined }
// Projectile: fire(x, y, target, payload, speed, flight: RicochetFlight); advance(dt): 'flew' | 'hit' | 'fizzle'; public fields bounces, life, struck: Enemy | undefined; get bouncesUsed(): number
// art/barrels.ts BarrelLook gains: arrow: boolean; ticks: number
```

### Steps
1. `core/rocks.ts`: `rockList` = every `'rock'` cell → `{ x: (col + 0.5) * CELL, y: (row + 0.5) * CELL - 3, r: CELL * 0.3 }` (matches `art/board.ts` exactly). `firstRockHit`: per rock not in `skip`, quadratic on the segment; skip when `c < 0` (starts inside) or no entry with `t` in `(1e-4, 1]`; keep smallest `t`; impact = `S + t*D`, normal = normalize(impact − center). `reflectDir`: `d = 2*(dx*nx + dy*ny); { x: dx − d*nx, y: dy − d*ny }`.
2. `content/augments/ricochet.ts`:
```ts
export const ricochet: AugmentDef = {
  id: 'ricochet', name: 'Ricochet',
  description: 'Shots bounce off a rock and hit the enemy behind. Added: shots bounce off one more rock.',
  asTower: 'Shots bounce off a rock and hit the enemy behind.', asAdded: 'Shots bounce off one more rock.',
  look: { shape: 'chevron', color: 'teal', size: 0.22 },
  first: { kind: 'shot', damage: 7, range: 4.5, rate: 1.25, projectileSpeed: 10, bounces: 1 },
  added: { bounces: 1 },
  tiers: { rare: { damageMul: 1.3, cooldownMul: 0.85, asAdded: 'Shots bounce off one more rock.' },
           epic: { damageMul: 1.7, cooldownMul: 0.7, asAdded: 'Shots bounce off one more rock.' } },
};
```
Verify the `(shape, color)` pair first against every file in `src/content/augments/` and `src/content/enemies/` (in-flight augments may have landed); if taken, use the next free of: chevron+blue, chevron+ice, circle+orange.
3. `core/augments.ts` `describeSpec`, shot branch:
```ts
const tail = `${spec.splash > 0 ? ', and the shots burst' : ''}${marked > 0 ? ', and its hits mark' : ''}`;
if (spec.firstId === 'ricochet') line = `Shots bounce off ${spec.bounces > 1 ? `${spec.bounces} rocks` : 'a rock'}: ${Math.round(spec.damage)} damage, every ${(1 / spec.rate).toFixed(1)} s${tail}`;
else { /* existing target/style line + tail */ if (spec.bounces > 0) line += `, and its shots bounce off ${spec.bounces} rock${spec.bounces > 1 ? 's' : ''}`; }
if (slow) line += `, slowing them by ${slow}%`;
```
(Tier multipliers give 9.1→"9"/0.68→"0.7" and 11.9→"12"/0.56→"0.6" once rounded, exactly the spec's numbers. The tower panel and draft need no changes: the panel's existing stats line shows the tier's damage/rate automatically; draft cards have no numbers line — do not invent one.)
4. `Projectile`: keep the old homing body as `advanceHoming` (byte-identical for `bounces === 0`). Ricochet flight: `life += dt`; `life > 10` → fizzle. Consume `remaining = speed * dt` in at most `bounces + 1` segments: while `!straight` aim at the target (`travel = min(remaining, dist)`; endpoint on the target), else fixed `(dirX, dirY)`; `firstRockHit(pos→endpoint, rocks, bouncedOff)`; enemies only when `straight` — first active `e` whose center is within `e.def.look.size * CELL + 4` of the segment (smallest distance wins). Rock first at `at = rock.t * |endpoint−pos|`: if `bouncedOff.length < bounces` → move to impact, `reflectDir` into `(dirX,dirY)`, push index, `straight = true`, `fx.pop(impact)`, `sfx?.tink()`, `remaining −= at`, continue; else `fx.pop(impact, 18)` → `'fizzle'` (a rock after the last bounce stops the shot). Enemy first → `struck = e`, move to it → `'hit'`. Homing, no rock: `dist <= max(remaining, 6)` → `struck = target` → `'hit'`; else move, done. Straight, nothing: move; if outside `0..bounds.w / 0..bounds.h` → `fx.pop(pos, 18)` → `'fizzle'` (silent). `lost` = `!straight &&` old check. `fire()` resets every new field; `despawn()` clears `struck`/`bouncedOff`/`straight`/`life`.
5. `ProjectileSystem.update`: `'hit'` → `this.enemies.hit(p.struck ?? p.target!, p.payload!)`; `'fizzle'` → `despawn()`. Add `brokenBounce(): string | undefined` — a live bolt with `bouncesUsed > bounces` or `bounces > MAX_SLOTS` or NaN position or `life > 12`. In `TowerSystem.attack`'s `fireBolt` closure, append one arg: `{ bounces: spec.bounces, rocks: this.board.rocks, enemies: this.enemies.all, bounds: { w: this.board.width, h: this.board.height }, fx: this.fx, sfx: this.sfx }`.
6. `FxSystem.pop(x, y, radius = 12)` (before `burst`): white filled circle, scale 0.4→1.25, fade 200 ms, via `track`. `Sfx.tink()` (after `shoot`): `this.tone(1568, 0.05, 'sine', 0.08, 2093)` — never louder than the shoot blip.
7. `barrelLook`: `arrow: spec.firstId === 'ricochet'`, `ticks: spec.bounces - (spec.firstId === 'ricochet' ? 1 : 0)`. In `barrels.ts`: key gains `:${look.arrow ? 'a' : 's'}:${ticks}`; add `w * 1.1` to the texture size when `arrow`; after the barrel, fill a triangle `(c − w*0.7, c − len + w*0.45) → (c + w*0.7, c − len + w*0.45) → (c + w*1.1, c − len − w*0.55)` in the bright body color (kinked tip); then `min(3, ticks)` thin rounded rings (`w*1.24 × w*0.22`, corner `w*0.11`) at `c − len * (0.82 − 0.12*i)` in `PALETTE[ricochet.look.color]` (import the def).
8. `runChecks.ts`: `['projectiles.bounce', (g) => g.projectiles.brokenBounce()],` after `projectiles.count`.
9. `npm run check` then `npm run smoke`.

### Pitfalls
- The `bounces === 0` path must behave exactly like today's homing bolt — Bolt/pulse bolts (and Lance, T0004) ride it.
- Pooling: reset every field in `fire()`; a deflected (`straight`) bolt ignores target death (`lost` guard) but must still end via enemy, rock, board edge or the 10 s cap; `bouncedOff` skip prevents ping-pong between adjacent rocks; the segment loop is bounded (`bounces + 1`).
- Rock circles must match the painted tokens (the `- 3` y-offset included); the road centerline never enters a rock circle, so a target is never inside one.
- Arrowhead and ticks are painted into the barrel texture (it rotates with the gun) — never into `DECORATIONS` (around the body, where the tier pips live).
- The 8.75 DPS common Ricochet is deliberate (deflected shots reach beyond the 4.5 range): widen `augments.test.ts`'s "hold wave 1" DPS test to `min > 7` and `ratio < 2.6` with a comment; do not change the task's numbers.
- Fizzle and target-less shots are silent; one pop + one tink per rock only.

### Tests
- `tests/core/rocks.test.ts` (new): `rockList` on a seeded map (5 rocks, geometry matches the paint); `firstRockHit` (impact sits on the circle, nearest of two wins, `skip` honored, miss → undefined, starts-inside → undefined); `reflectDir` (head-on reverses, unit length, angle preserved).
- `tests/core/augments.test.ts`: `towerSpec` bounces = Ricochet copies (lone ricochet 1, bolt+ricochet 1, bolt+2×ricochet 2, bolt 0); `describeSpec` per tier ("7 damage, every 0.8 s" / "9 … 0.7 s" / "12 … 0.6 s"); bolt+ricochet appends "bounce off 1 rock"; `tierAddedLine` identical at all tiers. Fizzle/no-falloff/Bolt-added flight is Phaser entity behavior: covered by the invariant + smoke, not unit tests.

## Note (by hand, 2026-10-28)

No longer waits on T0025, T0035: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Rejected (by hand, 2026-10-28)

Cut before it was built: its premise doesn't hold in this game. Shots fly over rocks and home in on their target (there is no line of sight), so there is never an enemy "behind a rock" that a tower can't already hit; a bounce would only send a shot that was going to land somewhere else. Like Lead, it's a mechanic that only matters under conditions the game doesn't have (see the content bar). Don't re-propose a rock-bounce shot unless rocks start blocking shots.
