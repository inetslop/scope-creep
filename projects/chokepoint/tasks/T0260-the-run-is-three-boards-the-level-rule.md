---
id: T0260
title: "The run is three boards: the level rule"
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T05:49:22Z
claimed_at: 2026-10-30T07:04:29Z
epic: E3
---

## Goal
A run gets a shape: three levels of ten waves each, a new longer board at each clear, and a win at the end — E3's foundation, the journey the vision's short runs need.

## Details
- A run is three levels; a level is ten waves; the waves number continuously 1-30, so every existing wave rule keeps working untouched (the quiet every 4th, the tight every 8th, the boss every 10th — E5's wave-10 and wave-20 bosses end levels 1 and 2: each level's tougher final wave).
- Level 1's board is generated exactly as today (the run's seed, the run's base length target with owned tech applied). Clearing wave 10 or 20 with lives left clears the level: the shared top-center card (the WaveBanner/topBanner pattern) slides in — "Level 1 clear" over a muted "the road re-grows" — for ~1 s, then the board re-grows: a new island from the run's seed and the level number (a new road, new rocks; the generator's own rules, including the choke (T0217), apply), with a longer road — level N's length target is the run's base target × 1.25^(N−1) (level 2 ×1.25, level 3 ×1.5625 of the base; the bend target is unchanged). A level's board is a pure function of (seed, level), so a ghost run replays the saved run's exact boards and a resumed run resumes on its exact current board, as today's save does.
- The new board starts empty: the previous level's towers are gone. The gold carries over in full, and the lives carry over. The draft then opens on the new board exactly as after any wave (its fit row (T0243) sees no towers and stays hidden, like the pre-wave-1 draft), then the build phase, then the next wave.
- Clearing wave 30 with lives left ends the run as a win: the game-over card's headline reads "Made it" with a muted "level 3 · wave 30" line and the usual score, coins, recipe and best-combo lines; the win counts as wave 30 for the best wave, the leaderboard and the recent runs, with no change to those.
- A run that dies says how far it got: the game-over card shows its level and final wave on one muted line ("level 2 · wave 14", the score-breakdown line's style (T0083)); if the card already shows the final wave, the level joins that line instead of repeating it.
- Unchanged: the coin formula, wave bonuses, kill gold, the clean/held ledger, last stand, the streak, the menu demo (it runs one wave, not a run), the pause screen — no new input or button anywhere in this task (the wave card's level line is T0262).
- The board bar, stated: the player sees a new island at each level clear — a new road shape, a new choke, more road to cover — so each level re-opens the placement puzzle with the banked gold; that is what makes placing at level 2 more interesting than at level 1.
- The level rule lives in one new pure module (a core/level.ts, the core/waves.ts pattern) with unit tests: the level of a wave, the clear condition, the win condition, the length multiplier per level.

## Acceptance criteria
- [ ] Waves 1-10 of a fresh run play byte-identically to today (same board, same wave rules, same draft/build/wave flow); nothing visible changes before a level clears.
- [ ] Clearing wave 10 with lives left shows the "Level 1 clear" top card, then a new board with a visibly longer road (×1.25), new rocks and its own choke, no towers, gold and lives intact; the draft opens on it and the run continues at wave 11.
- [ ] Level 2's road is visibly longer than level 1's within the same 14x8 / 8x14 frame, and level 3's is ×1.5625 of the base.
- [ ] Clearing wave 20 does the same for level 3.
- [ ] Clearing wave 30 ends the run with the "Made it" game-over card and its muted "level 3 · wave 30" line, the usual lines beneath, and wave 30 accepted by the best wave, the leaderboard and the recent runs.
- [ ] A run that dies at, say, wave 14 shows "level 2 · wave 14" on its game-over card.
- [ ] A resumed run mid-level 2 or 3 continues on its exact current board and wave, and no level clear re-triggers on resume.
- [ ] The smoke test passes on desktop and mobile; every card that shows fits at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/core/level.ts` - pure level rule (core/waves.ts pattern): waves per level, levels, max wave, level of a wave, clear/win conditions, per-level length multiplier, per-level board seed
- create `src/ui/hud/LevelClearBanner.ts` - HudPart: "Level N clear / the road re-grows" via the shared `TopBanner` (model on `LastStandBanner.ts`)
- create `tests/core/level.test.ts` - unit tests for the level rule
- edit `src/core/run.ts` - `RunPhase` gains `'won'`; new field `level = 1`; `over` getter returns `phase === 'over' || phase === 'won'` (update its doc comment); nothing else
- edit `src/core/saveRun.ts` - `SavedRun` gains `level: number`; validator `if (p.level !== undefined && !inInt(p.level, 1, 3)) return undefined;`; loader defaults `level: inInt(p.level, 1, 3) ? p.level : 1` (old saves keep working). The `lengthMul` validator stays as-is: the save now stores the **base** (level 1) multiplier, which is still only 1 or 1.25
- edit `src/core/map.ts` - one branch in `generateMap`'s run length: `const run = lengthMul >= 1.5 ? 1 : lengthMul > 1 ? rng.int(1, 2) : rng.int(2, 3);` (the `1.5625` target must wind more than `1.25`; the `1`/`1.25` behaviors are untouched)
- edit `src/systems/RunFlow.ts` - constructor's `scene` param typed `GameScene` (`import type`); new field `pendingLevelClear = 0`; `clearWave()` gains the win/level-clear branches before the clean-wave branch; `endRun()` body moves into new private `toGameOver()` and `endRun` adds `runsLost`; new `winRun()` calls `toGameOver()`
- edit `src/systems/Board.ts` - drop `readonly` from `map`/`path`/`width`/`height`/`towers`; keep a `private boardImage: Phaser.GameObjects.Image | undefined` (set in `drawCells()`); new `setMap(map: GameMap)`: destroy old image, assign map/`pathLineFor(map, CELL)`/width/height/fresh towers grid, `hover.clear()`, `range.clear()`, redraw
- edit `src/systems/TowerSystem.ts` - new `clearTowers()`: `for (const t of this.towers) t.destroy(); this.towers.length = 0;`
- edit `src/systems/Building.ts` - new `clearForNewBoard()`: `selectedTower = undefined; pointerTower = undefined; this.board.showRange(undefined, 0); this.ghost.clearAll(); this.uiVersion += 1;`; the three `this.run.phase === 'over'` checks become `this.run.over`
- edit `src/systems/ExitWarning.ts` - new `destroy(): void { this.img.destroy(); }`
- edit `src/systems/RunSave.ts` - `persist`: `lengthMul: this.game.baseLengthMul` and add `level: run.level`; `restore`: `run.level = saved.level;`; `update`: clear the save on `phase === 'over' || phase === 'won'`
- edit `src/scenes/GameScene.ts` - new fields `baseLengthMul = 1`, `mapBends = 0`; `create()` computes `const level = saved ? saved.level : 1`, `this.baseLengthMul = saved ? saved.lengthMul : ghost === undefined ? boardLengthMul(loadProfile(window.localStorage).purchased) : 1`, `this.mapBends` the same way from `saved.bends`/`boardBends`, and generates with `const boardRng = level === 1 ? this.run.rng : new Rng(boardSeedFor(this.run.seed, level))` and mul `this.baseLengthMul * levelLengthMul(level)`; new public `regrowBoard(level)`; `hook.setBuildSpots` closure reads `this.board.map` instead of the captured `map`; `openPause` uses `this.run.over`
- edit `src/scenes/HudScene.ts` - import + one `parts` line `new LevelClearBanner(this),` after the `LastStandBanner` line
- edit `src/scenes/GameOverScene.ts` - win/level text (see Steps 8)
- edit `src/debug/runChecks.ts` - one invariant line after `run.ledger`
- edit `tests/core/saveRun.test.ts` - `level: 1` in the `sample()` fixture; round-trip/reject/missing tests for `level`
- edit `tests/core/map.test.ts` - average-length test for 1.5625 vs 1.25 (see Tests)

### Interfaces
```ts
// src/core/level.ts (pure, no Phaser)
export const WAVES_PER_LEVEL = 10;
export const LEVELS = 3;
export const MAX_WAVE = WAVES_PER_LEVEL * LEVELS; // 30
/** Waves 1-10 -> 1, 11-20 -> 2, 21-30 -> 3; clamped to 1..3 outside. */
export function levelOfWave(wave: number): number;
/** Wave 10 or 20 (a level ends, the run goes on). */
export function isLevelClear(wave: number): boolean;
/** Wave 30 (the run is won). */
export function isRunWin(wave: number): boolean;
/** Level N's road length target over the run's base: 1, 1.25, 1.5625 (= 1.25^(N-1)). */
export function levelLengthMul(level: number): number;
/** Board seed for (seed, level): level 1 -> seed >>> 0, else (seed ^ Math.imul(0x9e3779b9, level)) >>> 0. A level's board is a pure function of (seed, level). */
export function boardSeedFor(seed: number, level: number): number;
```
- `RunState`: `level: number = 1` (doc: "Which level of the run's three: the board re-grows at each level clear."). `wavesCleared` needs no change (`'won'` falls to `wave`, i.e. 30).
- `RunFlow`: `pendingLevelClear: number = 0;` ("The cleared wave that re-grows the board (10 or 20); the LevelClearBanner shows its card once per wave number.")
- `GameScene.regrowBoard(level: number): void`:
```ts
this.towers.clearTowers();
const mul = this.baseLengthMul * levelLengthMul(level);
const map = generateMap(new Rng(boardSeedFor(this.run.seed, level)), this.board.map.cols, this.board.map.rows, ROCKS, this.mapBends, mul, this.run.bgen);
this.mapLengthMul = mul;
this.board.setMap(map);
this.exitWarn.destroy();
this.exitWarn = new ExitWarning(this, this.board, this.enemies, getSfx(this));
this.leakCost = new LeakCost(this.run, this.fx, this.board);
this.building.clearForNewBoard();
```
- `RunFlow.clearWave()`, after the existing `popText`, before the clean-wave branch:
```ts
if (isRunWin(this.run.wave)) {
  this.run.phase = 'won';
  this.scene.time.delayedCall(1000, () => this.winRun());
  return;
}
if (isLevelClear(this.run.wave)) {
  this.run.level = levelOfWave(this.run.wave + 1);
  this.pendingLevelClear = this.run.wave;
  if (clean) this.s.fx.cleanLines(cx, cy + 40, this.run.cleanStreakLine(!streakPaidBefore && this.run.streakPaid));
  this.scene.time.delayedCall(1000, () => { this.scene.regrowBoard(this.run.level); this.openDraft(); });
  return;
}
```
(`1000` ms matches the banner's slide-hold-fade; `toGameOver()` = current `endRun` body: set `towerKills` registry, stop `SCENES.hud`, start `SCENES.gameOver`.)
- `ui/hud/LevelClearBanner.ts`: `implements HudPart`; owns a `TopBanner`; `layout(width)` delegates; `update(game)`: `const w = game.flow.pendingLevelClear; if (w > 0 && w !== this.seen) { this.seen = w; this.banner.show([`Level ${levelOfWave(w)} clear`, 'the road re-grows']); }`.

### Steps
1. `src/core/level.ts` + `tests/core/level.test.ts`; `src/core/run.ts` (`'won'`, `level`, `over` getter); `src/core/map.ts` one-line branch.
2. `src/core/saveRun.ts` (`level` field/validator/default); `src/systems/RunSave.ts` (persist `level: run.level` and `lengthMul: this.game.baseLengthMul`; `restore` sets `run.level`; clear on `'won'`).
3. Board side: `Board.setMap`, `TowerSystem.clearTowers`, `Building.clearForNewBoard` (+ the three `run.over` checks), `ExitWarning.destroy`.
4. `GameScene`: fields, `create()` rewrite of the bends/length/board lines per Interfaces, `regrowBoard`, buildSpots closure, `openPause`; `RunFlow`: `GameScene` type, `pendingLevelClear`, clearWave branches, `toGameOver`/`winRun`.
5. `ui/hud/LevelClearBanner.ts` + the `HudScene` line (next to `LastStandBanner`).
6. `GameOverScene`: `const won = run.phase === 'won';` title `won ? 'Made it' : 'Overrun'` with `titleStyle(44, won ? PALETTE.greenDeep : PALETTE.red)`; the wave line: won -> `` `level ${levelOfWave(run.wave)} · wave ${run.wave}` `` with `titleStyle(22, PALETTE.muted)`, loss -> `` `Held until wave ${run.wave} · level ${levelOfWave(run.wave)}` `` (level joins the existing line, style unchanged). All other lines, `recordRun` and the boards card untouched.
7. `runChecks.ts` invariant, next to `run.ledger`: `['run.level', (g) => (g.run.wave >= 0 && g.run.wave <= MAX_WAVE && g.run.level >= 1 && g.run.level <= LEVELS && (g.run.phase !== 'won' || g.run.wave === MAX_WAVE) ? null : `wave ${g.run.wave}, level ${g.run.level}, phase ${g.run.phase}`)]`.
8. `npm run check` until green, then `npm run smoke`.

### Pitfalls
- **Byte-identical level 1**: `create()` must keep level 1's board on `this.run.rng` (the first draft's offers consume the same stream after it). Never "unify" level 1 onto `boardSeedFor`.
- **Save semantics**: `SavedRun.lengthMul` becomes the *base* multiplier (level 1's total, unchanged for old saves); resume re-derives level N as `base × levelLengthMul(saved.level)` with `new Rng(boardSeedFor(seed, saved.level))` — that is what makes resumed/ghost boards exact.
- `ExitWarning`/`LeakCost` cache the exit-gate point from the old path at construction: rebuilding them after `setMap` is mandatory or the warning hangs on the old gate. `LeakCost` has no objects; plain reassignment is fine (its `seen` re-decides correctly from `run.lives`).
- Clear towers **and** `building.clearForNewBoard()` before/at `setMap` — a `selectedTower` pointing at a destroyed Tower throws in the panel.
- `'won'` is not `'over'`: `wavesCleared` already returns 30 for it; `RunSave` must clear on both; input guards use the `over` getter so the 1 s win pause can't build or pause.
- No camera re-layout in `regrowBoard` (same cols/rows frame); the new road is longer inside the same fit.
- The smoke run now lasts up to 30 waves; the invariants must hold across the board swap (hence the live `this.board.map` in the build-spots closure).
- Grid ceiling: with the 1.25 tech base, level 3's target (1.95) is as windy as the grid allows (runs of 1 cell) — same class as level 2; that's the max, and the criteria only require level 2 > level 1 and the targets to be passed.

### Tests
- `tests/core/level.test.ts` (new): `levelOfWave` for 1-30 per level plus clamping (0, 31); `isLevelClear` true only for 10/20 (check 0, 4, 8, 9, 11, 12, 19, 21, 29, 30 false); `isRunWin` true only at 30 (10, 20, 29 false); `levelLengthMul` 1/1.25/1.5625 for levels 1/2/3 and the three constants; `boardSeedFor` — level 1 equals `seed >>> 0`, levels 2 and 3 deterministic, distinct from each other and from the seed.
- `tests/core/saveRun.test.ts`: `level: 1` in `sample()`; a level-2 save round-trips; `level` 0 and 4 are rejected; a save without `level` loads as level 1.
- `tests/core/map.test.ts`: next to the existing 1.25 tests, an average test — over both orientations, seeds 1-5, bends 0/1, mean `path.length` with `lengthMul 1.5625` is strictly greater than with `1.25` (per-seed strictness is not guaranteed when every 1.25 draw happens to be a 1-cell run, so assert on the mean, like the existing ratio test).
