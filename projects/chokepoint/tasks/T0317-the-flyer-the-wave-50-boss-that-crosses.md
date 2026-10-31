---
id: T0317
title: "The Flyer: the wave-50 boss that crosses the sky"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T00:35:25Z
epic: E10
---

## Goal
The run's next peak: wave 50 sends the first thing in the game that never walks the road — a boss that crosses the island in a straight line, over towers and rocks, and at half health banks to a new line, so a build that only covers the road stops being enough.

## Details
- **The every-10 rule's fifth boss:** wave 50 sends exactly one Flyer and nothing else — the plan's whole budget in one shape (the Orb's and Hive's pattern) — declared as the wave's boss, so the arrival horn (T0268), the boss card (T0256) and the death burst and name card (T0273) fire for it with no new HUD. The Flyer has no out-of-reach phase, so the escape note (T0269) does not apply to it.
- **Numbers:** behavior `fly` (new — the crossing below); hp 720 base (the boss base, wave-scaled like the Orb's); speed 0.7 cells/s; gold 20; livesCost 1 (a boss leak costs one life, as always); threat exactly the wave-50 budget (the whole-budget pattern); fromWave 50; spawnOnly — never in a wave's mix, not counted in the 10-regular cap.
- **The crossing (the new behavior):** the Flyer never touches the road. Its route is one straight line from a spawn point off the island's edge, on the entrance side, to the exit gate; it flies the line at 0.7 cells/s, its triangle rotated to point along it. The spawn point is chosen from the board's seed (deterministic, different per board), on the island's edge, so the line crosses the island's interior and lands on the exit gate — never through the entrance gate.
- **The bank (the boss's beat):** at exactly 50% hp, once, the Flyer banks: its remaining route becomes two straight segments — from its current position to a bank point on the island's edge, then to the exit gate. The bank point is chosen from the seed so the new route is visibly different from the first line (it crosses another part of the island). 0.8 s before the turn, the two new segments show as the flight line's own thin red preview; the turn lands with one quiet falling tone (the Colossus out-of-reach note's shape, T0284). A rooted or slowed Flyer still banks on its hp clock — control buys time, not the beat.
- **The flight line's telegraph:** at the wave's start, a thin red line (the Flyer's own color) at ~50% alpha shows the first line from spawn to exit for 3 s; the Flyer then pops in at the spawn point with the ordinary spawn pop, and the line fades over 0.3 s. The line is a telegraph in the enemy's own language (the Dasher's, T0046) — it is gone before the crossing starts, leaves no mark on the board, and the Flyer's heading keeps the route readable after.
- **Progress is the remaining route:** the Flyer's "distance along the road" is its remaining distance to the exit gate along its current route (the first line; after the bank, the two segments). Every system that reads an enemy's progress — the beam's and the Mark's furthest-along pick, the exit warning's 3-second check (T0014), the next-wave button's enemies-left count, the wave-end check — reads that number, so the Flyer behaves like any enemy there with nothing new on screen.
- **Control:** Frost's slow and Anchor's root apply in range, exactly as to any enemy (a rooted Flyer hangs in the air, mid-crossing). Push's gust does not touch it — a gust pushes along the road, and the Flyer is not on the road. The Mark marks it; the beam holds it; everything that hits an enemy hits it.
- **What it punishes and what answers it:** it punishes a road-only build — towers that only reach the road may not reach the flight line at all, and the bank crosses a different part of the island, so a build that covered only the first line loses contact at half health. The answers are range (Beam's 3.5, Reach's 4.6, a Lance corridor along the line), a Splash or Spray close to the line, and control on the line (Frost's slow and Anchor's root stretch the crossing; a Push gust cannot).
- **The reference:** the wave preview shows the Flyer's token ×1; the name tag says "Flyer" on its first spawn (T0085); the bosses reference grows its row from the def (T0277), teach language: "crosses the island in a straight line — cover the line, not the road."

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | the basic walker on the road | the Flyer never touches the road — it cannot be pushed along it, held by it or paced by it; its whole crossing is its own line |
| Dasher | a movement that is not steady walking | the Dasher's burst stays on the road and repeats every cycle; the Flyer leaves the road entirely, and its line is the crossing itself |
| Colossus | the every-10 boss with a beat at half health | the Colossus's beat stops the fight (out of reach); the Flyer's beat keeps it coming, on a new line through uncovered ground |
| Orb | a boss that changes at half health | the Orb becomes two other enemies once; the Flyer stays one shape and re-aims itself |
| Hive | the whole wave in one boss shape | the Hive walks the road and grows the group; the Flyer never touches the road and adds nothing but its own crossing |

## Acceptance criteria
- [ ] Wave 50's plan is exactly one Flyer (the whole budget, the "boss" tag); every other wave plan is unchanged, and the seeded plans for waves 10, 20, 30 and 40 stay identical.
- [ ] The Flyer flies its straight line from the off-board spawn point to the exit gate at 0.7 cells/s, rotated to point along it; the 3 s red line shows the line before the spawn and no mark remains after it fades; the spawn point differs per board seed.
- [ ] At exactly 50% hp, once, the Flyer banks to two new straight segments (its position → an edge bank point → the exit gate) with the 0.8 s preview and the falling tone; the bank point is seeded and the new route visibly different from the first line; a rooted Flyer still banks on its hp clock.
- [ ] Progress is the remaining route distance: the beam and the Mark can hold the Flyer as the furthest, the exit warning fires within 3 s of the gate, and the enemies-left count is 1 while it flies and 0 when it is killed or leaks.
- [ ] Frost's slow and Anchor's root apply in range (a rooted Flyer stops in flight); a Push gust does not move it (unit test).
- [ ] The arrival horn, the boss card and the death burst and name card fire from the existing boss hooks; the name tag, the preview token and the bosses reference row show "Flyer"; the escape note does not fire.
- [ ] The look is a red triangle at 0.5 — a shape no enemy has; unit tests pin the wave-50 plan, the route math (one line → the bank → two segments, remaining distance) and the seeded choices; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/content/enemies/flyer.ts` - the Flyer def (pattern: `colossus.ts`)
- create `src/core/flyRoute.ts` - the seeded route + line math (pure core, no Phaser)
- create `src/systems/enemyHooks/flyLine.ts` - telegraph + bank preview + bank tone (hook)
- create `tests/core/flyRoute.test.ts` - route math and seeded-choice pins
- edit `src/content/types.ts` - `EnemyBehavior` gains `'fly'`; `EnemyDef` gains `bank?`
- edit `src/content/enemies/index.ts` - import + one registry line
- edit `src/core/waves.ts` - `bossId(50)` + its two comments
- edit `src/core/targeting.ts` - `TargetCandidate.remaining`; furthest picks compare it
- edit `src/core/control.ts` - `pushable()` predicate
- edit `src/entities/Enemy.ts` - fly fields, `takeFlight()`, `advance()` case, `remaining` getter, push gate
- edit `src/systems/EnemySystem.ts` - `takeFlight` call in `spawn()`, `brokenFly()` invariant
- edit `src/systems/attacks/mark.ts` - `furthestUnmarked` compares `remaining`
- edit `src/systems/ExitWarning.ts` - `inRange()` uses `remaining`
- edit `src/systems/enemyHooks/nearMiss.ts` - `enemy.remaining` check
- edit `src/systems/enemyHooks/index.ts` - `flyLine` line next to `bossPhase`
- edit `src/audio/Sfx.ts` - `bankNote()` after `bossOut()`
- edit `src/art/entities.ts` - flat triangle for `behavior === 'fly'`
- edit `src/debug/runChecks.ts` - exempt flyer from `enemies.onRoad`; two new lines
- edit `tests/content.test.ts`, `tests/core/waves.test.ts`, `tests/core/control.test.ts`, `tests/core/targeting.test.ts`, `tests/core/beam.test.ts`, `tests/core/beamShapes.test.ts`, `tests/core/sprayNeedles.test.ts`

### Interfaces
```ts
// content/types.ts: EnemyBehavior = 'walk' | 'dash' | 'fly';
// EnemyDef (after outOfReach):
bank?: { hpFrac: number; previewSec: number };
// core/flyRoute.ts:
export interface FlyRoute { spawn: Point; bank: Point; exit: Point; }
export function flyRouteFor(map: GameMap, cellSize: number): FlyRoute
export function firstLine(route: FlyRoute): PathLine        // spawn → exit
export function bankedLine(route: FlyRoute, from: Point): PathLine // from → bank → exit
// core/targeting.ts TargetCandidate: add after `distance`:
remaining: number; // board units to the exit along its own route: smaller is closer
// core/control.ts:
export function pushable(def: EnemyDef): boolean { return !def.ignoresControl && def.behavior !== 'fly'; }
// entities/Enemy.ts: fields flyRoute?: FlyRoute; flyLine?: PathLine; bankClock = -1; roadLen = 0;
get remaining(): number; // max(0, (flyLine ?? road).length - distance)
takeFlight(route: FlyRoute): void;
```
`flyer.ts`: id `'flyer'`, name `'Flyer'`, description `'The whole wave in one shape: it crosses the island in a straight line — cover the line, not the road.'`, behavior `'fly'`, hp 720, speed 0.7, gold 20, livesCost 1, threat 250 (waveBudget(50)), fromWave 50, `spawnOnly: true`, `bank: { hpFrac: 0.5, previewSec: 0.8 }`, `look: { shape: 'triangle', color: 'red', size: 0.5 }`.

### Steps
1. `flyRoute.ts`: fold the map into a seed — `let seed = (map.cols * 73856093) ^ (map.rows * 19349663); for (let i = 0; i < map.path.length; i++) { const c = map.path[i]!; seed = (seed + Math.imul(i + 1, c.col * 928371 + c.row * 689287 + 13)) >>> 0; }` then `const rng = new Rng(seed)`. `exit = cellCenter(last path cell, cellSize)`. Horizontal map: `row = rng.int(0, rows-1)` while `row === entrance.row` re-roll; `spawn = { x: -0.5*cellSize, y: (row+0.5)*cellSize }`; `col = rng.int(1, cols-2)`; `bank = { x: (col+0.5)*cellSize, y: spawn.y < rows*cellSize/2 ? rows*cellSize : 0 }`. Vertical: mirror (spawn `y = -0.5*cellSize`, `col` seeded off `entrance.col`, bank on `x = 0` or `x = cols*cellSize`, `row = rng.int(1, rows-2)`).
2. `Enemy.ts`: in `spawn()` after `this.reachClock = -1;` reset `flyRoute = undefined; flyLine = undefined; bankClock = -1; roadLen = path.length;` and `this.setRotation(0);`. Add `takeFlight` (sets both, `distance = 0`, position at `route.spawn`). In `advance()`: add `case 'fly': { const bank = this.def.bank!; if (this.bankClock < 0 && this.hp <= this.maxHp * bank.hpFrac) this.bankClock = 0; if (this.bankClock >= 0) { this.bankClock += dt; if (this.bankClock >= bank.previewSec) { this.flyLine = bankedLine(this.flyRoute!, { x: this.x, y: this.y }); this.distance = 0; this.bankClock = bank.previewSec; } } this.distance += speed * dt; break; }` (the clock runs before any root check — rooted it still banks). In the shared tail use `const line = this.flyLine ?? path;` for both `pointAt` calls and `return this.distance >= line.length;`; after dirX/dirY add `if (this.flyLine !== undefined) this.setRotation(Math.atan2(this.dirX, -this.dirY));` (the plate's formula; the texture is flat, so it may rotate). `pushBack` first line becomes `if (!this.active || !pushable(this.def) || units <= 0) return;`.
3. `EnemySystem.spawn`: after `enemy.spawn(def, hpMul, this.board.path, speedMul, distance);` add `if (def.behavior === 'fly') enemy.takeFlight(flyRouteFor(this.board.map, CELL));`. Add `brokenFly()` next to `brokenReach()`: active flyer with non-finite or `< 0`/`> flyLine.length + 0.01` distance or `bankClock < -1 - 1e-9`.
4. `waves.ts`: `bossId` returns `wave === 50 ? 'flyer' : wave === 30 ? 'orb' : wave === 20 ? 'titan' : 'colossus';` — `planWave`'s existing boss branch (`spawns: [{ enemy: bossId(wave)!, delaySec: 0 }], tags: ['boss']`) already handles wave 50; update the `isBossWave`/`planWave` comments to name the Flyer on 50.
5. `flyLine.ts` hook: one `Graphics` on `fx.scene` at `DEPTH.preview`, `lineStyle(2, PALETTE.red, 1)` + `lineBetween`. Each `update`: find the active `behavior === 'fly'` enemy; while `0 <= bankClock < bank.previewSec` redraw the two segments (`e.x,e.y → route.bank → route.exit`) at alpha 0.5; else while `e.age < 3` draw spawn→exit at 0.5, fading `0.5 * (1 - (e.age - 3) / 0.3)` until 3.3, then destroy the Graphics (`drop`). When `bankClock >= bank.previewSec` and not yet noted (WeakSet): `sfx?.bankNote()`. `onKill`/`onLeak` drop. No `fx.track` (bossPhase's per-frame Graphics pattern).
6. `Sfx`: `bankNote(): void { this.tone(220, 0.12, 'sine', 0.08, 180); }` — bossOut's shape — after `bossOut()`.
7. `art/entities.ts`: at the top of the per-enemy paint callback, `if (e.behavior === 'fly') { shapePath(ctx, e.look.shape, size / 2, size / 2, r); ctx.fillStyle = rgba(PALETTE[e.look.color], 1); ctx.fill(); return; }` — flat (no side face, no shadow) because it rotates.
8. Progress: `pickTarget`/`pickTargets` compare `remaining` (`bestRemaining = Infinity`, ascending sort); `mark.ts` the same; `ExitWarning.inRange` uses `e.remaining / speed <= 3` (drop `len`); `nearMiss` uses `enemy.remaining > 1.5 * CELL`.
9. `runChecks.ts`: `enemies.onRoad` skips `e.def.behavior === 'fly'`; add `['enemies.flyer', …at most one Flyer alive]` next to `enemies.orb` and `['enemies.fly', (g) => g.enemies.brokenFly()]` next to `enemies.reach`.
10. Registries: `ENEMIES` gets `flyer` after `shard` (boss block) with its import; `ENEMY_HOOKS` gets `flyLine` after `bossPhase` with its import.

### Pitfalls
- Pooling: `spawn()` must reset `flyRoute`/`flyLine`/`bankClock`/`roadLen` and rotation, or a recycled flyer rises turned with a dead route; `despawn()` needs nothing.
- `TargetCandidate.remaining` is required — every test object literal (targeting, beam, beamShapes, sprayNeedles) must gain it (`remaining: 100 - distance` keeps existing expectations byte-identical; all walkers share one road, so max-distance ⇔ min-remaining).
- `tests/content.test.ts:27` caps look size at 0.45 except titan/orb — add `|| e.id === 'flyer'` or the suite fails; add a `behavior === 'fly'` block pinning `bank`.
- Seeded plans 1–49 must stay byte-identical: the flyer is `spawnOnly`, filtered out of `planNormalWave` before any rng draw — do not touch the draw order; wave 50 still calls `planNormalWave` to burn its rng share.
- Frame-rate: bank clock and telegraph are `dt`-driven; the bank lands on the frame the clock crosses `previewSec` and clamps there, so the tone and the route switch happen exactly once.
- The line Graphics is a scene child (dies with GameScene shutdown); never `destroy()` pooled enemies; no new HUD, input or permanent board mark — the lines are transient and gone before the crossing matters.

### Tests
- `tests/core/flyRoute.test.ts`: same map → identical route; two different maps → different spawn/bank; horizontal spawn at `x === -0.5*CELL` with row ≠ entrance row and vertical mirror; exit = last cell center; bank on the island edge (y 0 or rows·CELL, x in [1.5, cols−1.5]·CELL); first line's length = |spawn−exit|, endpoints exact; bank at `firstLine.pointAt(d)` → `bankedLine` starts at that point, ends at exit, length = |from−bank| + |bank−exit| (remaining = length − distance walked).
- `tests/core/waves.test.ts`: `bossId(50) === 'flyer'`; wave 50 = `[{ enemy: 'flyer', delaySec: 0 }]`, `['boss']`, `waveHpMul(50)`, identical on seeds 1/7/42/50; no wave 1–49 sends a flyer.
- `tests/core/control.test.ts`: `pushable` true for dot, false for ward and flyer (a gust does not move the Flyer).
- Add `remaining` literals to the four targeting/beam test files as in Pitfalls.
