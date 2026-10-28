---
id: T0042
title: "Resume a run: a run closed mid-way is kept and offered on the menu"
size: M
priority: 2
status: todo
depends_on: [T0015, T0019]
attempts: 0
created: 2026-10-28T11:24:34Z
epic: E1
---

## Goal
A run closed mid-way (tab closed, phone locked) is no longer lost: the profile keeps it, and the menu offers a Resume button beside Play, so a 10-25 minute run survives the browser being closed.

## Details
- The run is saved only at phase boundaries, at exactly two moments, each overwriting the profile's saved run: (1) when the build phase starts — after the pre-wave-1 draft pick, and after every wave clears including its wave bonus — and (2) when the wave phase starts — when the build countdown ends.
- The save holds: the board seed (the board regenerates from it), every tower (grid cell plus each slot's augment and tier), gold, lives, the wave number, the phase (build or wave), the hand (picked cards not yet placed, with tiers), and the run's tally so far (waves held, stopped, clean waves, coins).
- Menu: while a saved run exists, a "Resume · Wave N" button sits directly above the Play button, in the same white rounded button style (N = the saved run's wave number). Tapping it regenerates the board from the saved seed, rebuilds every tower with its slots and tier pips, restores gold, lives, the hand and the tally, and enters the saved phase: build starts the countdown at full length, wave starts that wave fresh from its first spawn.
- Closing a tab mid-wave loses only the partial wave: resume restarts that wave from its first spawn with the gold the run had when the wave started, so the half-fought wave is simply replayed.
- Starting a new run while a saved run exists abandons it for nothing: Play clears the save and starts fresh.
- A finished run clears the save: after game over and the claim, the menu shows only Play.
- No new key, no new HUD element. The pause screen is unchanged — Resume is a menu button, labeled where it is used, like Play.

## Acceptance criteria
- [ ] Start a run, place one tower, close the tab during the build phase; reopen: the menu shows a "Resume · Wave 1" button above Play.
- [ ] Tap Resume: the board is the same road and rocks (same seed), the tower stands in the same cell with the same augments and tier pips, gold, lives and the HUD coin tally are as saved, and the build countdown runs from its full length.
- [ ] Close the tab mid-wave; tap Resume: the wave restarts from its first spawn with the start-of-wave gold, and board, towers, lives and tally are restored.
- [ ] With a saved run, tap Play: a fresh board starts and the Resume button is gone.
- [ ] Finish a run (game over, claim, menu): no Resume button, and the finished run appears in the profile and the Recent line as today.
- [ ] A device with no saved run shows exactly the menu it shows today (Play only).

## Design (architect, desktop)

### Files
- create `src/core/saveRun.ts` - pure (no Phaser) storage of the mid-way run: `SavedRun` type + `saveRun`/`loadSavedRun`/`clearSavedRun` under key `'chokepoint:saved-run'`. NOT the profile key: `core/profile.ts` is being edited by T0030/T0035.
- create `src/systems/RunSave.ts` - GameScene-owned system: writes the save when the run enters build or wave phase, clears it on `over`, and re-enters a saved run.
- create `tests/core/saveRun.test.ts` - round-trip and validation tests.
- edit `src/scenes/GameScene.ts` - consume the menu's saved run, restore it, call `saver.update()` each frame.
- edit `src/scenes/MenuScene.ts` - "Resume · Wave N" button above Play; Play clears the save; layout + entrance tween.
- edit `src/debug/runChecks.ts` - one invariant line.

### Interfaces
```ts
// core/saveRun.ts
export interface RunStore { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; } // window.localStorage fits
export interface SavedTower { col: number; row: number; slots: number; augments: AugmentCopy[]; }
export interface SavedRun { v: 1; seed: number; cols: number; rows: number; gold: number; lives: number; wave: number; phase: 'build' | 'wave'; hand: AugmentCopy[]; kills: number; cleanWaves: number; rerollUsed: boolean; towers: SavedTower[]; }
export function saveRun(store: RunStore | undefined, run: SavedRun): void;
export function loadSavedRun(store: RunStore | undefined): SavedRun | undefined;
export function clearSavedRun(store: RunStore | undefined): void;

// systems/RunSave.ts
export class RunSave { constructor(game: GameScene, store: RunStore); update(): void; restore(saved: SavedRun): void; }
```
`loadSavedRun` returns `undefined` unless ALL hold: `v===1`; `phase` is `'build'|'wave'` (and `wave>=1` when `'wave'`); `seed` int 0..2^53; `cols`,`rows` int 1..32; `gold` finite 0..1e6; `lives`,`wave`,`kills`,`cleanWaves` int 0..1e6; `hand` array ≤100, each `{id,tier}` with id in `AUGMENTS` and tier in `TIER_ORDER`; `towers` array ≤200, each col/row int 0..63, `slots` int 1..`MAX_SLOTS`, `augments` array ≤`slots` of valid copies. Parse error / missing key / empty string → `undefined`. `saveRun`/`clearSavedRun` wrap in try/catch with a `/* private mode */` comment, like `profile.ts`.

### Steps
1. `core/saveRun.ts`: the types above; small `inInt(v,min,max)`/`inRange`/`isCopy` helpers; the two writes and the validated load.
2. `systems/RunSave.ts` (`import type { GameScene } from '../scenes/GameScene'` is safe — type-only). `private phase: RunPhase | '' = ''`.
   - `update()`: `const phase = this.game.run.phase; if (phase === this.phase) return; this.phase = phase; if (phase === 'build' || phase === 'wave') this.persist(phase); else if (phase === 'over') clearSavedRun(this.store);`
   - `persist(phase: 'build' | 'wave')`: `saveRun(this.store, { v: 1, seed: run.seed, cols: board.map.cols, rows: board.map.rows, gold, lives, wave, phase, hand: run.hand.map(c => ({ id: c.id, tier: c.tier })), kills, cleanWaves, rerollUsed, towers: this.game.towers.towers.map(t => ({ col: t.cell.col, row: t.cell.row, slots: t.slots, augments: t.augments.map(a => ({ id: a.id, tier: a.tier })) })) });`
   - `restore(saved)`: set `run.gold/lives/wave/kills/cleanWaves/rerollUsed`, `run.hand = saved.hand.map(c => ({ id: c.id, tier: c.tier }))`; per saved tower: `const cell = { col: t.col, row: t.row }; const c = this.game.board.centerOf(cell); const tower = new Tower(this.game, c.x, c.y, cell); this.game.board.place(cell, tower); this.game.towers.towers.push(tower); tower.slots = t.slots; for (const a of t.augments) tower.addAugment(a);` then, build: `const seconds = saved.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between; this.game.flow.buildTotalSec = seconds; run.startBuild(seconds);` wave: `run.wave = saved.wave - 1; run.phase = 'build'; this.game.waves.start();` (comment: `startWave()` counts the wave back up and replans it from its first spawn). Last: `if (run.hand.length > 0) this.game.building.cardAdded();`
3. `GameScene.ts`: add `import { RunSave } from '../systems/RunSave';`, `import type { SavedRun } from '../core/saveRun';`, field `saver!: RunSave;` after `flow!`. In `create()`: replace the `new RunState(...)` line with `const saved = this.registry.pop('resumeRun') as SavedRun | undefined;` then `this.run = new RunState(saved ? saved.seed : (flags.seed ?? Math.floor(Math.random() * 2 ** 31)));`; replace `const portrait = view.height > view.width;` with `saved ? saved.rows > saved.cols : view.height > view.width` (a save made on a landscape screen must keep that board); after `this.rally = new RallySystem(...)` add `this.saver = new RunSave(this, window.localStorage);` and `if (saved) this.saver.restore(saved);`; change `this.flow.openDraft();` to `if (!saved) this.flow.openDraft();`. In `update()` add `this.saver.update();` right after `this.flow.update(dt);`.
4. `MenuScene.ts`: `play()` becomes `clearSavedRun(window.localStorage); this.scene.start(SCENES.game);`. After the Play button: `const savedRun = loadSavedRun(window.localStorage); let resume: Button | undefined;` and if present `resume = makeButton(this, 0, 0, \`Resume · Wave ${savedRun.phase === 'build' ? savedRun.wave + 1 : savedRun.wave}\`, () => { this.registry.set('resumeRun', savedRun); this.scene.start(SCENES.game); }, { width: 220, height: 60, fontSize: 24, radius: 30, fill: PALETTE.ink });` (import `type Button` from `ui/button`). Entrance tween list becomes `[profileCard, how, ...(resume ? [resume.container] : []), button.container, hint]`. In `layout()`: `const extra = resume ? 78 : 0;` use `(height - 460 - extra)` in the `k` min and `block = MENU_ROAD_SIZE.height * k + 460 + extra`; `if (resume) resume.container.setPosition(cx, y + 294);`; `button.container.setPosition(cx, y + 290 + extra); hint.setPosition(cx, y + 343 + extra);` — all other positions unchanged.
5. `runChecks.ts`: after the `'run.ledger'` line add `['resume.taken', (g) => (g.registry.get('resumeRun') ? 'a saved run is waiting for the game that never took it' : null)],`.
6. `tests/core/saveRun.test.ts` (vitest, model on `tests/core/profile.test.ts`, Map-backed `RunStore` fake).

### Pitfalls
- Never restore a tower through `TowerSystem.build()` (it spends gold and plays sfx); push the `Tower` into `game.towers.towers` and `board.place` it directly.
- Wave resume must NOT call `run.startWave()` (it would double-count the wave): set `wave = saved.wave - 1`, `phase = 'build'`, then `waves.start()`.
- `RunSave.update()` saves only on entry into build/wave — never on `draft`, never every frame; it clears (once) on entry into `over`, which is what makes the post-game-over menu show Play only.
- The registry is the game-wide `Phaser.Data.DataManager`: removal is `registry.pop(key)`, not `delete`.
- Menu: forgetting `extra` in the `k`/`block` math pushes the hint off-screen at 412x915; do not move the `how` text. Resume has no key hint (Play's "Enter or Space" stays Play's).
- Hand cap is 100, not a small number: an unplaced card accumulates per wave.
- Closing mid-draft is fine by design: the last build-start save replays that build (fresh countdown, no new draft pick).
- Don't touch `core/profile.ts`, `RunFlow.ts` or `WaveSystem.ts` (T0030/T0035/T0015/T0019 edit them).

### Tests
- `tests/core/saveRun.test.ts`: save→load round-trips to an equal object and `clearSavedRun` empties it; `undefined` for missing/`'{oops'` storage; rejects `v: 2`, `phase: 'draft'`, negative `wave`, `hand: [{ id: 'nope', tier: 'common' }]`, `tier: 'mythic'`, `slots: 0`, `slots: 5` (> MAX_SLOTS), and 2 augments in 1 slot (write the broken JSON straight via `setItem`).
