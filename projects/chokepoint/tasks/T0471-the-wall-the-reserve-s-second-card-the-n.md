---
id: T0471
title: "The wall: the reserve's second card — the next wave's walkers walk 0.7×"
size: M
priority: 2
status: todo
depends_on: [T0463]
attempts: 0
created: 2026-11-03T04:35:57Z
epic: E24
---

## Goal
The reserve grows its second heavy card: for 80 gold, once per run, the next wave's walkers walk 0.7× — a whole-wave slow the player times against the wave they can see coming in the preview.

## Details
- The reserve card (T0463) gains a second entry under the surge: "Wall · 80" with the coin glyph while unbought (the surge line's own look, including its quiet state when the gold is short), its muted one-liner "next wave's walkers 0.7×", and "Wall · used" after the buy.
- The buy pays 80 gold, once per run, and the run save carries it (T0463's pattern). It applies to the wave that starts next — the one after the buy's build phase, whether it starts on the countdown or by early send.
- The effect: every walker in that wave moves at 0.7× its speed, for that wave only:
  - the crawl: every walker's base speed — Dot, Block, Hauler, Bulwark, Mute, the Ward's would-be speed (it ignores the wall, below), and the walkers a walled wave spawns mid-wave (the Shard, the Splinter, the Hive's popped Dots).
  - the dash: the Dasher's dash covers the same 3 cells in 0.3 s / 0.7 (≈ 0.43 s); its crawl and its pause are otherwise untouched.
  - the ramp: the Sprinter's current speed — base plus its ramp; the ramp keeps growing on top of the walled speed.
  - the boss: every walking boss (the Colossus, the Titan, the Orb, the Hive, the Mender, the Leech, the Gorge, and the Blinker's walk phase) at 0.7×.
  - untouched: the Ward (like its control immunity, T0111), the crossers (the Flyer boss and the regular Flyer keep their pace), the Blinker's blink jump itself (its distance and its cycle), a Push gust's distance, and the 2x fast-forward.
  - stacking: the 0.7× is one multiplicative factor on the walker's speed — applied with the wave's own speed rules (the thin road's 0.9, the rush tag's 1.5) and under the tower auras (the Haste's +30% to both applies to the walled speed, and any per-enemy slow applies as a percentage of it).
  - the wall is a wave rule, not a slow effect: no per-enemy mark, no slow chip (T0138), no Ward immunity ring (T0335) — the wave's own "walled" chip is its only display.
- The chip: the walled wave wears a muted "walled" chip where the "surged" chip sits (T0463) — on the preview's tag row (T0422) the moment the buy commits, and on the wave banner at the wave's start (T0080) — that wave only.
- Two cards bought in the same build phase both apply to the same next wave (their effects stack on it).
- The reserve card hides when every entry the card currently shows is spent (T0463's rule, counted over the entries that exist — not over the harvest, which is not built yet).
- A run that never buys the wall is byte-identical to today; the surge's entry and its behavior are untouched.

## Acceptance criteria
- [ ] In a build phase with 80+ gold the reserve card's second line reads "Wall · 80" with the coin glyph and the muted "next wave's walkers 0.7×" line; with 79 gold it wears the surge line's own quiet state and the tap does nothing.
- [ ] Buying pays 80 gold, the line reads "Wall · used", and in the next wave (countdown or early send) every walker moves at 0.7×: a Dot walks 1.12 cells/s, a max-ramp Sprinter walks 3.72 cells/s, the Dasher's dash takes ≈ 0.43 s for its 3 cells.
- [ ] In a walled wave the Ward and the crossers (the Flyer, the Flyer boss) keep their pace, the Blinker's blink jump is unchanged, and on a rush-tagged wave the walkers move 1.5 × 0.7 = 1.05× of base.
- [ ] The walled wave's preview tag row and its banner wear the muted "walled" chip; the following wave wears no chip; no per-enemy mark or chip appears on the slowed walkers.
- [ ] With the surge and the wall both bought the card hides (until the harvest exists, "every entry shown" means both); after closing the tab and resuming, the bought Wall still reads "Wall · used".

## Design (architect, desktop)

### Files
- create `src/core/wall.ts` — the Wall's pure rule: constants + buy/state/stamp functions.
- create `tests/core/wall.test.ts` — unit tests for the buy rule.
- edit `src/core/run.ts` — two RunState fields `wallBought`, `wallNext` (next to T0463's surge fields, else after `farGateTold`, line 59).
- edit `src/core/saveRun.ts` — `SavedRun` gains `wallBought`/`wallNext`; `loadSavedRun` validates and defaults them (next to T0463's surge save fields, else the `streakPaid` lines).
- edit `src/systems/RunSave.ts` — persist + restore the two fields; re-stamp the chip after `planNext()` on a build resume.
- edit `src/systems/WaveSystem.ts` — re-stamp on resume in `start()`, pass the factor in `update()`, consume in `waveEnded()`.
- edit `src/systems/EnemySystem.ts` — `spawn()` gains `wallMul = 1`, forwarded to `enemy.spawn()`.
- edit `src/entities/Enemy.ts` — `wallMul` field, spawn reset, three speed formulas.
- edit `src/systems/enemyHooks/split.ts`, `midSplit.ts`, `hivePops.ts` — forward the parent's `wallMul` to mid-wave children (Shard, Splinter, Hive's Dots).
- edit `src/ui/hud/ReserveCard.ts` (T0463's card) — the Wall entry under the surge.
- edit `src/ui/hud/NextWavePreview.ts` — make the card rebuild tag-aware so the chip shows the moment the buy commits.
- edit `src/debug/runChecks.ts` — the `wall.mul` invariant (after `walk.mul`, line 220) + `WALL_FACTOR` import.

### Interfaces
```ts
// src/core/wall.ts (all new)
export const WALL_FACTOR = 0.7;   // a walled wave's walkers walk this fraction of their speed
export const WALL_COST = 80;      // run gold
export const WALLED_TAG = 'walled';
export function wallEntryState(run: RunState): 'bought' | 'ready' | 'short' {
  if (run.wallBought) return 'bought';
  return run.canAfford(WALL_COST) ? 'ready' : 'short';
}
export function buyWall(run: RunState, nextPlan: WavePlan | undefined): boolean {
  if (run.wallBought || !run.spend(WALL_COST)) return false; // fails without paying
  run.wallBought = true;
  run.wallNext = true;
  markNextWalled(nextPlan);
  return true;
}
export function markNextWalled(nextPlan: WavePlan | undefined): void {
  if (nextPlan !== undefined && !nextPlan.tags.includes(WALLED_TAG)) nextPlan.tags.push(WALLED_TAG);
}
```
RunState: `wallBought = false;` and `wallNext = false;` (comments: bought once per run; next wave walled until that wave ends).
Enemy: field after `walkMul`: `wallMul = 1;` — "The wave's wall factor it took (the reserve's Wall: 0.7; the Ward and the crossers take 1); its split children take the same."
Spawn signatures (both get one trailing param): `EnemySystem.spawn(..., lane: 0 | 1 = 0, wallMul = 1)` and `Enemy.spawn(..., lane: 0 | 1 = 0, wallMul = 1)`.

### Steps
1. `core/wall.ts` as above (import `RunState` type from `./run`, `WavePlan` type from `./waves`).
2. `run.ts` fields; `saveRun.ts` fields + two `loadSavedRun` lines (`if (p.wallX !== undefined && typeof p.wallX !== 'boolean') return undefined;` and `wallBought: p.wallBought === true,` / `wallNext: p.wallNext === true,`); `RunSave.persist`/`restore` lines; in `restore`'s build branch, after `game.waves.planNext();` add `if (run.wallNext) markNextWalled(game.waves.nextPlan);` (+ import).
3. `WaveSystem`: import `{ WALL_FACTOR, WALLED_TAG, markNextWalled }` from `../core/wall`. In `start()`, after `this.plan = ...; this.planned = undefined;`: `if (this.run.wallNext) markNextWalled(this.plan);` (a resumed run re-plans the wave without the tag). In `update()`: `const wall = plan.tags.includes(WALLED_TAG) ? WALL_FACTOR : 1;` and append `wall` as the last arg of the `enemies.spawn(...)` call (line 107). In `waveEnded()`, after the `heldLost` line: `if (this.plan?.tags.includes(WALLED_TAG)) this.run.wallNext = false;`.
4. `EnemySystem.spawn`: append `wallMul = 1` param, pass it through at line 121. `Enemy.ts`: set in `spawn()` next to `this.walkMul = walkMul;`: `this.wallMul = pushable(def) ? wallMul : 1; // the Wall reaches the road's walkers; the Ward and the crossers keep their pace` (`pushable` is already imported, line 9 — it is exactly `!ignoresControl && behavior !== 'fly' && !flies`). In `advance()`: line 270 becomes `this.speed * (1 - this.slowPct) * (1 + this.hastePct) * stretchMul * this.wallMul` (extend its comment); line 293 `this.dashLeft = c.dashSec / (this.walkMul * this.wallMul);`; line 296 append `* this.wallMul` to the dash rate. Leave the ramp cap in `hit()` untouched.
5. Hooks: `split.ts` `..., enemy.lane, enemy.wallMul);`; `midSplit.ts` capture `wl = e.wallMul` with `sm, wm, wk` and pass `..., lane, wl);`; `hivePops.ts` `..., e.walkMul, d, 0, e.wallMul);` (add the explicit `0` lane).
6. `ReserveCard`: add a second entry under the surge, mirroring the surge entry's exact construction (same row text style, coin glyph, quiet state, tap path and its on-screen hint — if T0463 gave the surge a hotkey, give the Wall one next to it in `HOTKEYS`). By `wallEntryState(run)`: `ready` → `Wall · 80` + coin glyph; `short` → the surge line's own quiet state, tap does nothing; `bought` → `Wall · used`; under it always the muted line `next wave's walkers 0.7×`. Tap calls `buyWall(run, game.waves.nextPlan)`. Tap region = the entry's two lines, ≥ 44 CSS px. Card layout stays content-driven: the Wall's name row sits below the surge's line row, each row's y from the row above, card width = widest row + padding, height = rows + padding (the fullest state is 4 rows, widest ≈ `next wave's walkers 0.7×` ≈ 160 px — fits 412×915 and 1280×720 at T0463's position). Hide rule: T0463's, counted over the entries that exist — hidden only when surge AND wall are bought.
7. `NextWavePreview`: if T0463 already made the rebuild tag-aware, verify `walled` flows through it and skip. Otherwise add `private tagsKey = '';`, set it next to `this.planNumber = plan.number;` in the rebuild block, and extend the rebuild condition (line 78) to `this.planNumber !== plan.number || this.tagsKey !== plan.tags.join('|')`. The banner (`WaveBanner`/`topBanner`) needs no change: it reads `currentPlan.tags` at wave start and `tagChip('walled')` falls back to `PALETTE.faint` — the muted chip. Do NOT add `walled` to `WAVE_TAG_ROWS` or the preview's `TEACH` table.
8. `runChecks.ts`: after `walk.mul`: `['wall.mul', (g) => (g.enemies.all.every((e) => !e.active || e.wallMul === 1 || e.wallMul === WALL_FACTOR) ? null : "an enemy carries a wall factor that is neither 1 nor the Wall's 0.7")],`.
9. Tests, then `npm run check` and `npm run smoke`.

### Pitfalls
- The Flyer boss is `crosser` with `behavior: 'fly'` and NO `flies` field — exclude with `pushable(def)`, never `def.flies ? 1 : ...`, or wave 50's boss walks walled. The regular Flyer has `flies: true`; the Ward `ignoresControl: true` — `pushable` covers all three.
- Do not scale the ramp cap in `hit()`: the factor multiplies the speed actually walked, so a max-ramp Sprinter walks 5.32 × 0.7 = 3.72 cells/s and its ramp keeps growing (a Dot walks 1.6 × 0.7 = 1.12). Scaling the cap would need the factor inside `hit()` and changes the numbers.
- Dasher: `wallMul` goes into BOTH the dash leg's duration (0.3/0.7 ≈ 0.43 s) and its per-frame rate — the dash still covers exactly 3 cells, stretched in time. Its crawl takes the wall via `speed`; its pause duration stays `pauseSec / waveSpeedMul`. The Blinker is walled only on its walk leg (via `speed`); its fixed `blinkDest` jump and cycle timings are untouched.
- Consume `wallNext` in `waveEnded()`, not `start()` — a save mid-walled-wave must resume walled (wave resume replays the wave), and `waveEnded` runs before RunSave's phase-change save so a build save never carries a stale `true`.
- Resumes re-plan the wave without the tag: re-stamp from `run.wallNext` in both `WaveSystem.start()` and `RunSave.restore()` after `planNext()`.
- Pooled `Enemy`: `spawn()` must reset `wallMul` (a recycled slot keeps the wave's factor otherwise).
- Don't touch `speedMul` (the `level.speed` invariant compares it); an unbought run stays byte-identical (`wallMul` 1, no tag).
- If T0463 excluded the surge tag from `start()`'s tag buzz/note (lines 68–70), exclude `walled` the same way; otherwise leave it.
- No GameScene/HudScene/Sfx changes; no per-enemy mark, slow chip or Ward ring — the wave's `walled` chip is the only display.

### Tests
`tests/core/wall.test.ts` (style of `tests/core/run.test.ts`, `new RunState(1)`, plan fixture `{ number: 5, spawns: [], hpMul: 1, tags: [] }`): `WALL_FACTOR` is 0.7 and `WALL_COST` 80; `wallEntryState` bought/ready(≥80)/short(79); `buyWall` at 79 gold returns false with gold, fields and plan untouched; `buyWall` at 100 pays 80, sets both flags, tags the plan `walled`; a second `buyWall` fails without paying and never double-tags; `markNextWalled` is idempotent and safe with `undefined`.
