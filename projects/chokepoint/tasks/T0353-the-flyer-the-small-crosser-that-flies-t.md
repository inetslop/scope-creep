---
id: T0353
title: "The Flyer: the small crosser that flies the sky"
assignee: asus
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T11:14:54Z
claimed_at: 2026-11-01T16:09:58Z
epic: E10
---

## Goal
The road stops being the only line on the board: a small fast enemy flies straight across the island to the exit, so a build that only covers the road stops being enough — the regular half of E10 (the wave-50 boss, T0317, is the big version of the same crossing).

## Details
- A new enemy, the Flyer, with a new way of moving: instead of walking the road it crosses the island. It spawns at a point on the island's edge (the seed picks the point, on the entrance's side of the board) and flies in a straight line at constant speed to the exit gate. The line is its whole path — one line for its whole life, no turns (banking is the boss's T0317 depth). The line is chosen so it crosses the island's open build area — never along the road; a crossing that follows the road is not a crossing. If the boss Flyer (T0317) has landed first, build on its crossing instead of duplicating it (same behavior, this one single line, no banking); if it has not, this task is the first crossing and the boss reuses it.
- Numbers: hp 60 (wave 1 base; the waves scale it as they scale the others), speed 2.0 cells/s, gold 8, livesCost 1, threat 3, fromWave 13.
- How often: one on wave 13, 17, 21, 25, 29, 33, … — the Feeder's exact slot and skips (the slot never lands on a boss, quiet or tight wave).
- Look: a new silhouette — a small wing shape (two rounded chevrons, one behind the other, distinct from the Sprinter's single chevron) that points the way it flies; purple (a repeated family color, a new silhouette — the Mute lesson); size 0.2. A new shape in the shape set, bright and abstract, no theme. Description line for the enemies reference: "The crosser: flies straight from the island's edge to the exit — the road doesn't hold it."
- The tell: the moment it spawns, one thin purple ring at the entry point on the edge grows and fades over 0.5 s (the boss-arrival ring's language, T0312); after that its own straight-line flight is the read. The next-wave preview shows its token and count with no change to that card.
- Targeting: for the "furthest along" target rules (Bolt, Beam, Ember, Mark, Splash, Reach), the Flyer's progress is its closeness to the exit — the same ordering the other enemies get from their road progress, so every attack's target rule works unchanged.
- Control: it takes damage from everything (a burn ticks, a mark marks, a splash bursts over it); a Frost slow slows it, and the Haste aura speeds it (the 2-cell distance rule reaches it in the sky as on the road); a Push gust and an Anchor root do not reach it — a gust moves it not and a root stops it not.
- A kill is an ordinary kill (the gold pop, the kill-combo, the Mint's 2-cell radius, the by-tower ledger and the run summary); a leak costs 1 life at the exit, and the exit warning's last 3 seconds work on it as on a walker.
- The Feeder leaves the game in this task (the regular cap is 10 of 10): its content, its neighbor-speeding ring and hook, its crescent art and its reference entry all go; its slot becomes the Flyer's. The Feeder's name tag, preview token and reference row disappear with it (they read from the content). The Wall (parked in IDEAS) stays parked — it needs a slot the Flyer does not open.
- What counters it and what it punishes: the answer is a tower off the road whose range crosses the line — a Frost slow is the best use of one, a Beam holds it as it passes — and it punishes the road-only build, which never touches it, and the slow heavy shot that needs time it does not get.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dasher | its own movement instead of a plain walk | the Dasher's whole cycle — crawl, stop, surge — happens on the road; the Flyer never touches the road at all: it crosses the island in a straight line from the edge to the exit, so road cover does not meet it |
| Sprinter | a mid-run enemy whose identity is speed | the Sprinter earns its speed hit by hit and has to walk the road; the Flyer is fast from the spawn on the shorter straight line, and the road's controls (push, root) do not reach it |

## Acceptance criteria
- [ ] from wave 13, one on 13, 17, 21, 25, 29, 33, …: the Flyer appears at a point on the island's edge (one thin purple ring there, 0.5 s) and flies in a straight line at 2.0 cells/s to the exit gate — never on the road, one line for its whole life
- [ ] its token is the new small wing silhouette (purple, size 0.2) pointing the way it flies; it appears in the next-wave preview and the enemies reference with its name and its dry line, and its first appearance gets the one-time name tag
- [ ] every attack reaches it: the "furthest along" ordering treats it by closeness to the exit; a Frost slow slows it; a Push gust and an Anchor root do not move or stop it
- [ ] killing it pays 8 gold with the ordinary kill (the pop, the combo, the Mint radius, the by-tower row); letting it reach the exit costs 1 life, with the exit warning's red gate and ticks in its last 3 seconds
- [ ] a build that covers only the road holds it not at all, and a tower off the road whose range crosses the line kills it
- [ ] the Feeder is gone: not in the content, not in any wave (13, 17, 21, … send the Flyer), no ring or hook for it, no entry in the enemies reference

## Design (architect, desktop)

The Flyer reuses the pooled `Enemy` unchanged in spirit: its whole path is just a different `PathLine` (one straight line, edge → road's end), so the existing `'walk'` behavior, targeting (`distance`), slow/haste/marks/burn, kills and leaks all work untouched. What is new: a seeded line picker in `core/flyRoute.ts`, a `flies` flag that gates push/root, per-enemy `path` stored on `Enemy` (so exit-warning and invariants compare against the enemy's own line), a flat rotatable wings token, and the spawn ring. The Feeder is deleted everywhere.

### Files
- create `src/content/enemies/flyer.ts` — the Flyer's `EnemyDef` (hp 60, speed 2.0, gold 8, livesCost 1, threat 3, fromWave 13, `flies: true`, look `{ shape: 'wings', color: 'purple', size: 0.2 }`, description exactly: `The crosser: flies straight from the island's edge to the exit — the road doesn't hold it.`)
- create `src/core/flyRoute.ts` — the crossing picker (see Interfaces). If this file already exists because T0317 landed first, use its `pickFlyLine` instead of writing it.
- create `src/systems/fx/flyRing.ts` — `flyRing(fx, x, y)`: model `fx/bossRing.ts` but `r = 1.25 * CELL`, thickness 2, `PALETTE.purple`, `g.setScale(0.3)`, `fx.track(g, 500, { scale: 1, alpha: 0, ease: 'Quad.easeOut' })`, `DEPTH.preview`, early return on `fx.full`.
- create `src/systems/enemyHooks/flySpawn.ts` — `MakeEnemyHook` named `flySpawn`: model `nameTag.ts` (WeakMap serial watch); when a `def.id === 'flyer'` enemy is seen at a new serial, call `flyRing(fx, e.x, e.y)` (its first frame is exactly the edge point).
- create `tests/core/flyRoute.test.ts` — see Tests.
- delete `src/content/enemies/feeder.ts` and `src/systems/enemyHooks/feederPack.ts`
- edit `src/content/enemies/index.ts` — replace the `feeder` import line with `import { flyer } from './flyer';` (same slot) and `feeder,` with `flyer,` in `ENEMIES` (same slot, between `mute` and `ward`).
- edit `src/content/types.ts` — `Shape`: swap `'crescent'` for `'wings'` in place; add to `EnemyDef` right after `ignoresControl`: `/** It flies: its whole path is one straight line from the island's edge (the seed picks the point) to the exit (core/flyRoute.ts), never the road. A Push gust and an Anchor root do not reach it; a Frost slow and the Haste aura do. */` `flies?: boolean;`
- edit `src/core/waves.ts` — three lines: in the `walkers` filter swap `e.id !== 'feeder'` for `e.id !== 'flyer'`; in the budget line swap `'feeder'` for `'flyer'` (keep `budget -= unlocked.find(...).threat`, wave >= 13, `(wave - 13) % 4 === 0`); in the `reserved.push(...)` line swap `'feeder'` for `'flyer'`; update the two comments to say Flyer.
- edit `src/entities/Enemy.ts` — (1) add field next to `distance`: `/** The line it walks: the road for a walker, its own crossing for a flyer (core/flyRoute.ts). */` `path!: PathLine;` (2) in `spawn()`: set `this.path = path;` and `this.setRotation(0);`; delete `packPct` reset; (3) `advance(dt: number, path: PathLine)` becomes `advance(dt: number)` using `this.path` (both `pointAt` calls and the `distance >= this.path.length` leak check); delete the two `(1 + this.packPct)` factors (lines 178 and 204) and the `packPct` field+comment; (4) after the `dirX/dirY` computation, add `if (this.def.flies) this.setRotation(Math.atan2(this.dirY, this.dirX) + Math.PI / 2);` (texture points up; flat, so it may turn like the tracer); (5) in `root(sec)`: first line `if (this.def.flies) return;`; in `pushBack(units)`: after the `active` guard, `if (this.def.flies) return;` (no `deny` flag: the task asks for no tell).
- edit `src/systems/EnemySystem.ts` — import `pickFlyLine` from `../core/flyRoute`; in `spawn()`: `const line = def.flies ? pickFlyLine(this.board.map, this.run.rng, CELL) : this.board.path;` and `enemy.spawn(def, hpMul, line, speedMul, waveSpeedMul, def.flies ? 0 : distance);` (a flyer always starts on its own edge — the far-gate distance never applies to it); in `update()`: `e.advance(dt)`.
- edit `src/systems/ExitWarning.ts` — in `inRange()` drop `const len = this.board.path.length;` and test `(e.path.length - e.distance) / speed <= 3`.
- edit `src/systems/enemyHooks/nearMiss.ts` — line 12 becomes `if (enemy.path.length - enemy.distance > 1.5 * CELL) return; // its own line: a flyer's crossing, not the road`.
- edit `src/systems/enemyHooks/index.ts` — replace the `feederPack` import line with `import { flySpawn } from './flySpawn';` and the `feederPack,` list line with `flySpawn,` (the Feeder's slot becomes the Flyer's).
- edit `src/art/paint.ts` — delete the crescent branch; add a `'wings'` branch in its place: `const front = shapePoints('chevron', radius).map((p) => ({ x: p.x, y: p.y - radius * 0.25 })); const back = shapePoints('chevron', radius * 0.7).map((p) => ({ x: p.x, y: p.y + radius * 0.55 })); ctx.beginPath(); traceRounded(ctx, front, radius * 0.28); traceRounded(ctx, back, radius * 0.7 * 0.28); return;` — both chevrons into ONE path so a single fill paints the pair; and split `roundedPolygon` into `roundedPolygon` (beginPath + traceRounded + closePath, behavior unchanged) plus the new `traceRounded(ctx, pts, round)` containing its current loop body minus begin/close.
- edit `src/art/shapes.ts` — `sides` map: drop `crescent: 0`, add `wings: 0` (same slot).
- edit `src/art/entities.ts` — in the `ENEMIES` painter loop, before the `paintToken` call: `if (e.look.shape === 'wings') { shapePath(ctx, 'wings', size / 2, size / 2, r); ctx.fillStyle = rgba(PALETTE[e.look.color], 1); ctx.fill(); return; }` — flat: no side face, no shadow, so the token may rotate.
- edit `src/debug/runChecks.ts` — delete the `enemies.pack` line; change `enemies.onRoad` to test `e.distance > e.path.length + 1` (message: `an enemy is off its line`); add next to it: `['flyer.line', (g) => (g.enemies.all.some((e) => e.active && e.def.flies && ((!Number.isFinite(e.path.length) || e.path.length <= 0) || e.pushLeft > 0 || e.rootLeft > 0)) ? 'a flyer with a broken line, or pushed or rooted' : null)],`
- edit `tests/core/waves.test.ts` — line 83: `'feeder'` → `'flyer'` (and its comment); replace the Feeder `it` (lines 108-115) with the identical test for `'flyer'` ("sends exactly one Flyer on 13, 17, 21, ...").

### Interfaces
```ts
// src/core/flyRoute.ts
export interface FlyLine {
  spawn: Point; // on the entrance edge, board units
  exit: Point;  // the road's own end: one cell past the exit, as pathLineFor
  line: PathLine; // the two-point flight
}
export function exitPoint(map: GameMap, cellSize: number): Point;
export function openFraction(map: GameMap, cellSize: number, a: Point, b: Point): number; // 0-1 of quarter-cell samples over 'open' cells
export function pickFlyLine(map: GameMap, rng: Rng, cellSize: number): FlyLine;
```
`pickFlyLine`: `exit` = center of the `after` cell (same rule as `pathLineFor`); spawn = on the entrance edge — `vertical ? { x: rng.range(0.5, cols-0.5)*cs, y: 0 } : { x: 0, y: rng.range(0.5, rows-0.5)*cs }`; redraw the spawn point from `rng` while `openFraction < 0.2` (a line that follows the road is not a crossing), at most 24 tries, then accept. Pure, deterministic per seed — T0317 and T0346 build on it.

### Steps
1. Content first: `flyer.ts`, `index.ts`, delete `feeder.ts`; `types.ts` (`wings`, `flies`); `waves.ts` slot swap.
2. `core/flyRoute.ts` (+ its test file).
3. `Enemy.ts` (path field, `advance(dt)`, rotation, push/root gates, `packPct` removal) and `EnemySystem.ts` (line choice, `advance(dt)`).
4. `ExitWarning.ts`, `nearMiss.ts` per-enemy line length.
5. Hooks: delete `feederPack.ts` + its two lines in `index.ts`; add `flyRing.ts` + `flySpawn.ts` + its two lines.
6. Art: `paint.ts`, `shapes.ts`, `entities.ts`.
7. `runChecks.ts`; `tests/core/waves.test.ts` swap.
8. `npm run check`, then `npm run smoke`.

### Pitfalls
- `enemies.onRoad` must compare against `e.path.length`, not `board.path.length` — a flyer's line is shorter than the winding road and would trip it.
- Pooling: reset `setRotation(0)` in `spawn()` or a recycled flyer slot turns a walker; and never give the wings texture a shadow or side face (painted shading must stay at the bottom — it rotates).
- Delete every `packPct` reference (4 in `Enemy.ts`, 1 invariant) or the build breaks; don't set `deny` for the Flyer (the Ward's ring is Ward-only by design, and the task asks for no tell).
- A flyer's spawn must always be distance 0 (its own edge) — the far-gate `distance` from `WaveSystem` is road units and would pop it mid-air.
- Rng draws: exactly one spawn point per flyer, drawn at spawn from `run.rng` (retries included) — seeded runs stay reproducible.
- `MenuDemo` replans waves from `planWave`; at saved best ≥ 13 a Flyer walks the menu road. It is pure show and self-contained — leave it.
- No new HUD: the preview card, enemies reference and first-appear name tag are all content-driven and need no change.

### Tests
- `tests/core/flyRoute.test.ts`: on generated boards (two 14x8, one 8x14 portrait, `generateMap(new Rng(seed), …, 5)`): spawn on the entrance edge (`x === 0` landscape, `y === 0` portrait, along-edge coordinate inside the board); `exit` equals the road line's end (`pathLineFor(…).pointAt(length)`); `openFraction(map, CELL, spawn, exit) >= 0.2` for several seeds; line has exactly 2 points; same seed → same spawn and length.
- `tests/core/waves.test.ts`: the swapped Flyer slot test (one on 13, 17, 21, … ≡ 1 mod 4 through wave 30, never a Flyer-only wave); splitter "others" count excludes `'flyer'`.
