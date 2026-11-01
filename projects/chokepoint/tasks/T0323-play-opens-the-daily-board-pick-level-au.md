---
id: T0323
title: Play opens the daily board pick (level augments leave the menu)
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T01:39:40Z
epic: E9
---

## Goal
The owner's call: level augments are no longer a picker that sits on the main menu. Pressing Play (or Iron) opens a new step: pick a level, then one of **three boards**, each shown as a small preview with the level augments it carries. The three boards and their augments come from the **UTC date**, so every player gets the same choices on the same day, which makes the day's leaderboard a fair race.

## Details
- **The menu:** the level card (`scenes/menu/LevelCard.ts`) is removed from the menu. Play and Iron open the pick step instead of starting the run (Enter/Space on the menu opens it too). Resume and Ghost start their run directly, as today, with no pick step.
- **The pick step** (a new screen-space overlay scene, white cards on the ground color):
  - **Level row** on top: "Level 0", "Level 1", ... up to the profile's level slots, preselected on the highest. The player may play any level from 0 to their slots. With 0 slots there is no row, only the muted teaser "reach wave 30 to unlock level 1".
  - **Three board cards:** side by side on desktop, stacked on a phone (412×915). Each card has a small preview of the board exactly as the run will generate it (island, road, rocks, gates, with the player's own board tech: bends, length, chokes), the level augments it carries at the chosen level (name and line), and the run multiplier ("×1.45"; at level 0 no augments and no multiplier).
  - **The next goal** (moved here from the menu card): "wave 30 at level n unlocks level n+1", only while the slots are below the set size.
  - A tap or click on a card (or keys 1, 2, 3) starts the run on that board with those augments. A Back button (Esc) returns to the menu. Key hints are shown on the cards and the button.
  - Iron carries through: Iron, then the pick, then the run in Iron.
- **The daily choices** (a pure core module with unit tests, e.g. `core/daily.ts`):
  - From the UTC date (`YYYY-MM-DD` of the current time in UTC, never local time) derive three board seeds.
  - For each board, a seeded order of all level augments (a shuffle of `LEVEL_AUGMENTS` by that board's seed). At level L the board carries the first L of its order. So every player at the same level sees the same three choices, and a higher level only adds augments to the same boards.
  - The board's seed is the run's seed (`new RunState(seed, ...)`), so the board, and everything else the run seeds, follows from it. The board's orientation follows the device as today (a phone plays the portrait board of that seed); that is accepted.
  - The choices change at 00:00 UTC; the step reads the date when it opens.
- **The run:** its `level` is the picked board's augments (no longer `capLevelChoice(profile.levelSlots, profile.levelOn)`). The run save keeps `level` as today, so a resumed run keeps its augments and multiplier. The profile's saved `levelOn` is no longer read or written for new runs.
- **The slot ladder is unchanged** (`levelSlotsAfter` in `core/levels.ts`): wave 30 with every unlocked slot filled (level = slots) earns the next slot; a run below the top level earns nothing new.
- **?smoke:** the menu's automatic Play goes through the pick step, which picks the first card on its own.

## Acceptance criteria
- [ ] The menu has no level card; Play and Iron open the pick step; Resume and Ghost don't.
- [ ] Unit tests: one UTC date always gives the same three seeds and augment orders; the next date gives different ones; level L takes the first L of each order; two instants on either side of 00:00 UTC fall on different days whatever the local time zone.
- [ ] Each card's preview is the board the run then plays (same seed, same tech).
- [ ] The level row goes from 0 to the slots, defaults to the highest, and changing it updates the cards' augments and multipliers.
- [ ] Works with mouse, keys (1/2/3, Esc) and touch, at 1280×720 and 412×915.

## Design (architect, desktop)

### Files
- create `src/core/daily.ts` - UTC day, the day's three board seeds, each board's augment order, the level slice, `DailyPick` (pure, no Phaser)
- create `src/scenes/PickScene.ts` - the pick step: level row, three board cards with live previews, back
- create `tests/core/daily.test.ts` - unit tests
- edit `src/scenes/keys.ts` - `pick: 'Pick',` in `SCENES`, right after `menu`
- edit `src/main.ts` - import `PickScene` and register it in the scene array right after `MenuScene`
- edit `src/scenes/MenuScene.ts` - remove the level card (`buildLevelCard`/`saveLevelOn` imports, the `level` block, its `fadeIn.push`, its `level.height + GAP +` in `below`, its placement in `layout()`); `play()` and the Iron handler open the pick instead of the game
- delete `src/scenes/menu/LevelCard.ts`
- edit `src/scenes/GameScene.ts` - pop `dailyPick` from the registry; seed and level come from it; drop the `capLevelChoice` import
- edit `src/scenes/GameOverScene.ts` - add `levelOn: run.level.length` to the `recordRun` result
- edit `src/core/profile.ts` - `RunResult.levelOn?: number`; `recordRun`'s ladder uses it; delete `saveLevelOn`
- edit `src/core/levels.ts` - delete `capLevelChoice` (dead after the menu card and GameScene change)
- edit `src/art/board.ts` - extract the board drawing into a private `drawBoard(ctx, map, path)`; add `paintBoardPreview`
- edit `src/debug/runChecks.ts` - `['daily.taken', (g) => (g.registry.get('dailyPick') ? 'a daily pick is waiting for the game that never took it' : null)]` next to the other `taken` lines
- edit `tests/core/profile.test.ts` - delete the `saveLevelOn` test; add ladder-counts-the-run-level test
- edit `tests/core/levels.test.ts` - delete the `capLevelChoice` block

### Interfaces
```ts
// core/daily.ts
export function utcDay(ms: number): string;                        // 'YYYY-MM-DD' in UTC, from `new Date(ms).toISOString().slice(0, 10)`
export function dailySeeds(day: string): [number, number, number]; // FNV-1a 31-bit hash of `${day}:0|1|2` (h=2166136261, h^=char; h=Math.imul(h,16777619); (h>>>0)%2**31)
export function dailyOrder(seed: number): string[];                // new Rng(seed).shuffle(LEVEL_AUGMENTS.map(a => a.id))
export function dailyLevel(seed: number, level: number): string[]; // dailyOrder(seed).slice(0, Math.max(0, level))
export interface DailyPick { seed: number; level: string[]; }      // the registry payload under 'dailyPick'

// art/board.ts (drawBoard is the existing paintBoard body, moved verbatim)
export function paintBoardPreview(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine, px = 1): string;
// createCanvas at (cols*CELL + 2*BOARD_MARGIN)*px, ctx.scale(px,px), ctx.translate(m,m), drawBoard, refresh; remove the key first (like paintBoard)

// core/profile.ts
export interface RunResult { /* existing */ levelOn?: number; }    // how many level augments the run ran with (the ladder's "every slot filled")
// recordRun: levelSlotsAfter(old.levelSlots, result.reached ?? result.waves, result.levelOn ?? old.levelOn.length, LEVEL_AUGMENTS.length)
```

### Steps
1. `core/daily.ts` exactly as above, then `tests/core/daily.test.ts`.
2. `art/board.ts`: move the drawing body of `paintBoard`'s callback (island, grid dots, rocks, road, gates) verbatim into `function drawBoard(ctx, map, path)`; `paintBoard` keeps its signature and calls it through `paintTexture`; add `paintBoardPreview`.
3. Register the scene: `SCENES.pick`, one line in `main.ts`.
4. `PickScene.ts` (model `PauseScene`'s box+scale layout): `create()`: `uiCamera`, `hook.scene = SCENES.pick`, `hook.overlay = ''`, background `PALETTE.ground`; from `loadProfile`: `slots = Math.min(p.levelSlots, LEVEL_AUGMENTS.length)`, `level = slots`, `bends/lengthMul/chokes` from `boardBends/boardLengthMul/boardChokes(p.purchased)`; `seeds = dailySeeds(utcDay(Date.now()))` (read when the step opens); `build()`; `onResize`: rebuild when `(h <= w)` flips, else re-place; `onKey`: `Escape`→back, `'1'|'2'|'3'`→start(n-1); `if (flags.smoke) this.time.delayedCall(1200, () => this.start(0))`; on shutdown remove the six `pick:board:i:0/1` textures.
   `build()`: `portrait = height <= width`; `cardW = portrait ? Math.min(380, width-32) : Math.min(430, Math.max(300, (width-56)/3))`. Level row: chips `Level 0..slots` (`makeButton`, 56×48, fontSize 13, `fill: i === level ? PALETTE.ink : PALETTE.card`); tap → set `level`, `sfx?.blip()`, `this.time.delayedCall(50, () => this.build())`. `slots === 0`: one muted 14px line `reach wave 30 to unlock level 1` in the row's place. Goal line (only `0 < slots < LEVEL_AUGMENTS.length`), muted 13px: `wave 30 at level ${slots} unlocks level ${slots + 1}`.
   Card i (a `makeButton`, radius 20, label hidden, whole card tappable → `start(i)`): preview texture `pick:board:${i}:${portrait?1:0}` painted once per orientation with `generateMap(new Rng(seed), portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, bends, lengthMul, 2, chokes)` — copy GameScene's new-run `generateMap` arguments verbatim (they must stay identical; if that call gained a parameter when you read the file, include it) and `pathLineFor(map, CELL)`; image `setScale(Math.min(boxW/texW, boxH/texH))` (never `artScale` — the texture is painted at px=1, not ART). Box: portrait card 132×156 on the left, column right (`colW = cardW - 28 - 132 - 12`); landscape card: box `(cardW-28)×220` on top, column below at `cardW-28`. Column: for each id in `dailyLevel(seed, level)` a name (13 bold ink) over a line (12 muted, `wordWrap: {width: colW}`), y advanced by each text's own `.height` (+4 name/line, +7 between augments); then, only when `level > 0`, `levelMultiplierLabel(ids)` (16 bold ink). `cardH = 28 + (landscape ? prevH + 10 + columnH : Math.max(prevH, columnH))` (at level 0 the column is empty). Key hint `1/2/3` (11 bold faint) in each card's top-right corner and `Esc` beside the Back button (160×52): both hidden when `isNarrow(width)` (touch taps the card/button instead). Assemble one `box`, place `layoutView(w,h)`: `box.setPosition(w/2, h/2).setScale(Math.min(1, (w-16)/boxW, (h-16)/boxH))`. Fullest state (6 chips + goal + level 5 with all five augments, `Short fuse`'s line wrapping to two): boxH ≈ 910 at 412×915 → scale ≈ 0.98; ≈ 630 at 1280×720 → scale 1.
   `start(i)`: guard `closed`/range, set `this.registry.set('dailyPick', { seed: this.seeds[i]!, level: dailyLevel(this.seeds[i]!, this.level) })`, `this.scene.start(SCENES.game)`. `back()`: guard, `this.registry.delete('dailyPick')`, `this.scene.start(SCENES.menu)`.
5. `MenuScene.ts`: `play()` = `clearSavedRun(...)`, `this.registry.delete('ironMode')`, `this.scene.start(SCENES.pick)` (Enter/Space and smoke use it); Iron = `this.registry.set('ironMode', true)`, `clearSavedRun(...)`, `this.scene.start(SCENES.pick)`; remove every `level` reference; Resume and Ghost stay exactly as today.
6. `GameScene.ts`: `const pick = this.registry.pop('dailyPick') as DailyPick | undefined;`; seed line `saved ? saved.seed : (pick ? pick.seed : (flags.seed ?? ghost?.seed ?? Math.floor(Math.random() * 2 ** 31)))`; replace the `capLevelChoice` line with `this.run.level = pick ? pick.level : []; // the picked board's augments; ghost and "again" runs play at level 0`.
7. `GameOverScene.ts` (`levelOn: run.level.length`), `core/profile.ts` (interface + ladder line, delete `saveLevelOn`), `core/levels.ts` (delete `capLevelChoice`), `runChecks.ts`, the two test edits. `npm run check`.

### Pitfalls
- Registry hygiene: `dailyPick` is set only in `start()` and deleted in `back()`, or a stale entry would steal the seed/level of a later ghost, resume or "again" run (the new `daily.taken` invariant exists for this). Same for `ironMode`: the menu's Play deletes it, Iron sets it, and PickScene must only read it — GameScene pops it.
- The preview must be byte-identical to the run's board: same seed, same `generateMap` arguments (bends, lengthMul, chokes from the profile's tech, bgen 2), and the orientation from `viewSize()` at build time — a phone plays the portrait board of that seed, and a different orientation is a different board; repaint on orientation flip (the key carries it).
- Never `artScale` the preview (it is painted at px=1); scale it to its box directly. Remove the preview textures on shutdown.
- Rebuild on a chip tap goes through `delayedCall(50)`, so the pointerup that triggered it is already delivered; the chosen level lives in a field, not in the (destroyed) chips.
- `GameOver`'s "again" button and Ghost runs now start at level 0 (no pick step) — deliberate: `profile.levelOn` is no longer read for new runs; it remains in the save and only serves as `recordRun`'s fallback.
- Smoke: the menu's automatic Play now lands in PickScene, which must auto-pick card 0 on its own (`flags.smoke`); the whole flow gains ~1.2 s — confirm with `npm run smoke`, the script waits on state, but has a timeout.
- Chips at 412 px: 6 × 56 + 5 × 6 = 366 ≤ 380 — do not widen them.

### Tests
- `tests/core/daily.test.ts`: one fixed UTC day gives the same three seeds and the same three orders on every call (seeds in [0, 2^31)); the next day's seeds and orders differ; `dailyLevel(s, L)` equals `dailyOrder(s).slice(0, L)` and is nested (level L+1 extends level L); `dailyLevel(s, 0)` is `[]`; `utcDay(Date.UTC(2026, 0, 2, 0, 0, 0) - 1000) === '2026-01-01'` and `utcDay(... + 1000) === '2026-01-02'` — either side of 00:00 UTC is a different day whatever the local time zone, since the instants are built with `Date.UTC`.
- `tests/core/profile.test.ts`: new test — profile with `levelSlots: 2`; `recordRun` at `reached: 30` with `levelOn: 2` earns the slot, `levelOn: 1` earns nothing (the ladder counts the run's own level); delete the `saveLevelOn` test.
- `tests/core/levels.test.ts`: delete the `capLevelChoice` cases.
