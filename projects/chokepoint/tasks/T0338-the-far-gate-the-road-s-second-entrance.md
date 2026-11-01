---
id: T0338
title: "The far gate: the road's second entrance"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T04:12:33Z
claimed_at: 2026-11-01T06:27:27Z
epic: E13
---

## Goal
"Every board is different" goes past the rocks and the path's shape: on some boards the road grows a second gate partway along, and a share of every wave's enemies comes in through it — the player covers the road from two entry points, not just the entrance.

## Details
- **The board:** when a board's seed roll selects it (roughly one board in three; deterministic per seed, so the same seed always gives the same board, gate or not), the road grows a second gate — a gate token like the entrance gate — on a straight road cell about a third of the way from the entrance, away from the exit and away from the guaranteed choke cell. The island, the road and the build cells are otherwise unchanged; the gate is the road's own end, not a painted mark (the board bar in modules/board.md).
- **The wave:** on a far-gate board, in the wave's spawn schedule every 3rd spawn comes out of the far gate (so the far gate sends ⌊count ÷ 3⌋ enemies; a wave of 1 or 2 sends none). Those enemies start at the far gate and walk the remaining road to the exit — so they reach the exit sooner than a near-gate enemy spawned at the same moment. Boss waves (10, 20, 30, 40, 50) send their whole wave from the near gate — the far gate is silent on a boss wave. The rest of the wave (count, hp, mix, intervals, tags) is otherwise unchanged.
- **On screen (no new HUD element):** the board shows both gates; the board preview (the daily pick and the ghost run) picks both up from the board's own draw, with no change to that file; the next-wave preview wears one muted "far gate ×N" line under the counts while the board has the far gate and the wave sends through it (N the far gate's share; the line is absent otherwise, and absent on boss waves). The line must fit the preview card at 412×915 and 1280×720.
- **Why it makes placing towers more interesting:** a build that walls the entrance (the common early habit) is now exposed on the back half of the road, where the far gate feeds in; the guaranteed choke can sit on the wrong side of the far gate, so the player must cover the mid-road, not just the front.
- **What it punishes / what answers it:** it punishes an entrance-only build and a single-choke build. It is answered by spreading cover along the mid-road and by slows and roots on the far gate's short run (a root there holds an enemy that has little road left).
- New pure module (the seed roll, the far-gate cell, and the wave's per-gate split) with unit tests; the board generator, the wave plan and the spawn schedule all read from it. Spawning should read the far gate's road position from the board and the per-gate split from the wave plan, on the wave spawner's own path, so the enemy pool is left untouched.

## Acceptance criteria
- [ ] The far gate is decided deterministically from the seed (the same seed always gives the same answer); across a sweep of seeds roughly a third of boards carry it, on a straight road cell about a third of the way from the entrance, drawn like the entrance gate (unit test on the seed roll).
- [ ] On a far-gate board, a non-boss wave sends ⌊count ÷ 3⌋ enemies from the far gate (a wave of 1 or 2 sends none); those enemies start at the far gate and walk the remaining road to the exit; boss waves send everything from the near gate; the wave's count, hp, mix, intervals and tags are otherwise unchanged (unit tests on the per-gate split).
- [ ] The board and the board preview show both gates; the next-wave preview wears the muted "far gate ×N" line only when it applies (never on a boss wave, never on a board without the far gate), fitting at 412×915 and 1280×720.
- [ ] No new HUD element, input, sound or painted board mark beyond the gate token itself; a board without the far gate is byte-identical to today; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, inet-racing)

### Files
- NEW `src/core/farGate.ts` — pure module: gate roll helpers + cell pick + per-gate split (no Phaser)
- EDIT `src/core/map.ts` — `GameMap.farGate?: Cell`; `generateMap` does the roll
- EDIT `src/art/board.ts` — `drawBoard` paints the far gate token
- EDIT `src/systems/WaveSystem.ts` — far-gate distance in, offset in `update()`
- EDIT `src/scenes/GameScene.ts` — one line: pass the distance into WaveSystem
- EDIT `src/ui/hud/NextWavePreview.ts` — the muted `far gate ×N` line
- EDIT `src/debug/runChecks.ts` — one invariant line
- NEW `tests/core/farGate.test.ts`
- UNTOUCHED: `core/waves.ts`, `core/choke.ts`, `core/path.ts`, `Enemy`, `EnemySystem` (both `spawn`s already take `distance = 0`), `PickScene`, `saveRun.ts`

### Interfaces
`src/core/farGate.ts` (imports: `CHOKES_RANGE, chokeCells` from `./choke`; `type Cell, GameMap` from `./map`; `isBossWave, type WavePlan` from `./waves`; `CELL` from `../config`):
```ts
export function farGateCell(map: GameMap): Cell | undefined   // the gate's road cell, or none
export function farGateDistance(map: GameMap): number         // board units along the route; 0 with no gate
export function farGateSplit(count: number): number           // Math.floor(count / 3)
export function isFarGateSpawn(index: number, plan: WavePlan, hasFarGate: boolean): boolean
```
`farGateCell`: `n = map.path.length`; `n < 9` → undefined. `target = Math.floor(n / 3)`; scan `d = 0,1,...`, candidates `[target]` then `[target-d, target+d]` (earlier index first); candidate `i` must have `2 <= i <= Math.floor(n / 2)` (away from both ends), be straight (`path[i-1]->path[i]` step === `path[i]->path[i+1]` step, vector equality), and be `> CHOKES_RANGE` from every `chokeCells(map)` cell. Return first match; undefined when both candidates leave the window. `farGateDistance`: `(path.findIndex(farGate) + 1) * CELL` (cell i's center is `(i+1)*CELL` in; the route starts one cell before the entrance). `isFarGateSpawn`: `hasFarGate && farGateSplit(plan.spawns.length) > 0 && !isBossWave(plan.number) && index % 3 === 2`.

### Steps
1. Create `src/core/farGate.ts` as above.
2. `src/core/map.ts`: add to `GameMap`: `/** The far gate's cell (core/farGate.ts): a second entrance about a third of the way in, on about one board in three. */ farGate?: Cell;`. In `generateMap`, replace the last line with:
```ts
const result = bgen >= 2 ? ensureChokes(folded, chokes) : folded;
// The far gate (core/farGate.ts): one board in three grows a second entrance. The roll is the seed's last draw, so the road keeps this seed's usual shape.
return { ...result, farGate: rng.chance(1 / 3) ? farGateCell(result) : undefined };
```
Import `farGateCell` from `./farGate`.
3. `src/art/board.ts` `drawBoard`: lift the chevron direction out of `gate`'s else-branch into `const dirIn = Math.atan2(second.y - first.y, second.x - first.x);` and make the helper `const gate = (p: { x: number; y: number }, exit: boolean, dir = dirIn): void`. After `gate(edgeEnd, true);` add:
```ts
// The far gate: the road's second entrance (core/farGate.ts), a token on its own straight cell, chevron toward the exit.
const fg = map.farGate;
if (fg) {
  const i = map.path.findIndex((c) => c.col === fg.col && c.row === fg.row);
  const p = pts[i + 1]!;
  gate(p, false, Math.atan2(pts[i + 2]!.y - p.y, pts[i + 2]!.x - p.x));
}
```
Run board and PickScene previews both call `drawBoard` → the previews get the gate with no scene changes.
4. `src/systems/WaveSystem.ts`: add `private readonly farGateDistance: number;`; constructor `(run: RunState, enemies: EnemySystem, farGateDistance = 0)` stores it. In `update()`'s spawn loop:
```ts
// Every third spawn of a far-gate board comes out of the far gate, a third of the way down (core/farGate.ts).
this.enemies.spawn(getEnemy(spawn.enemy), plan.hpMul * this.run.levelHpMul, levelSpeedMul(this.run.level), isFarGateSpawn(this.next, plan, this.farGateDistance > 0) ? this.farGateDistance : 0);
```
Import `isFarGateSpawn` from `../core/farGate`.
5. `src/scenes/GameScene.ts` line 133: `this.waves = new WaveSystem(this.run, this.enemies, farGateDistance(map));` (+ import).
6. `src/ui/hud/NextWavePreview.ts`: import `farGateSplit` from `../../core/farGate` and `isBossWave` from `../../core/waves`. In `update()`, in the rebuild branch:
```ts
const farCount = game.board.map.farGate && !isBossWave(plan.number) ? farGateSplit(plan.spawns.length) : 0;
this.box = this.build(plan, this.teachLine(plan, game.run), farCount > 0 ? `far gate ×${farCount}` : undefined);
```
In `build(plan, teach, farLine)`: create `farText` (same muted 14 style as `teachText`) when `farLine`; `this.cardW = Math.max(countsW, farText ? Math.ceil(farText.width) : 0, teachText ? Math.ceil(teachText.width) : 0) + PAD * 2;`; `this.cardH = LINE_H + (farText ? ROW_GAP + TEACH_H : 0) + (teachText ? ROW_GAP + TEACH_H : 0) + PAD * 2;`; after the counts loop: `let ly = -contentH / 2 + LINE_H + ROW_GAP + TEACH_H / 2; for (const t of [farText, teachText]) if (t) { t.setPosition(0, ly); ly += ROW_GAP + TEACH_H; }`; push `farText` into `pieces` when present.
7. `src/debug/runChecks.ts`, after the `board.fold` line:
```ts
['board.farGate', (g) => { const fg = g.board.map.farGate; if (!fg) return null; return g.board.map.path.some((c) => c.col === fg.col && c.row === fg.row) ? null : `the far gate at (${fg.col},${fg.row}) is off the road`; }],
```
8. Create `tests/core/farGate.test.ts`.

### Pitfalls
- The roll must be the LAST draw in `generateMap` (after the `ensureChokes` line) or every seed's road shape changes. It shifts the run's later rng draws (wave plans) by one — fine; determinism is per seed + code version.
- All consumers must tolerate `farGate === undefined` (scan can fail): distance 0, no token, no preview line.
- `isBossWave` guard is redundant for today's boss shapes (1–2 spawns ⇒ `farGateSplit` 0) but keep it — the task makes it an explicit rule.
- The split is derived from the plan's FINAL spawn list, so Crowded's `planWithLevel` growth is automatically consistent between spawner and preview (both read the same plan object); do not store a `farCount` on `WavePlan` and do not edit `waves.ts`.
- T0337 also edits `NextWavePreview.ts` — if it lands first, re-derive the far-line stacking against its version (same `build()` line structure).
- `pts` in `drawBoard` = [before, cell0..cellN-1, after], so cell i is `pts[i + 1]`; `i <= floor(n/2)` guarantees `pts[i + 2]` exists.
- Resume/ghost/daily need no save field: the board always regenerates from the run seed through `run.rng = new Rng(seed)`.
- The preview card may now be 3 lines tall; `place()`/`fitScale()` already key off `cardW`/`cardH` — no hardcoded offsets.

### Tests
`tests/core/farGate.test.ts` (model `tests/core/chokeGuarantee.test.ts`; helper `gen(seed, portrait)` = `generateMap(new Rng(seed), portrait ? 8 : 14, portrait ? 14 : 8, ROCKS, 0, 1, 2, 1, false)`):
- seed sweep 0..399 (portrait): gated count between 100 and 160 (~1/3).
- determinism: two `gen` calls per seed give the same `farGate` (or both undefined).
- placement rule for every gated board: `farGate` is a `'path'` cell at index `i` with `2 <= i <= floor(n/2)`, straight (step vectors equal), `> CHOKES_RANGE` from every `chokeCells` cell.
- `farGateDistance` = `(i + 1) * CELL` when gated, 0 otherwise.
- `farGateSplit(0..9)` = `[0,0,0,1,1,1,2,2,2,3]`.
- `isFarGateSpawn`: 6-spawn plan → true exactly at 2 and 5; 2-spawn plan → never; `planWave(10, new Rng(1), ENEMIES)` (boss) → never with `hasFarGate` true.
Then `npm run check` and `npm run smoke` (desktop 1280×720 + phone 412×915; the new invariant rides along).
