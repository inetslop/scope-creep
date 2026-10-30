---
id: T0291
title: "The payout: the level multiplier pays"
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: [T0285]
attempts: 1
created: 2026-10-30T17:15:59Z
claimed_at: 2026-10-30T20:29:06Z
epic: E9
---

## Goal
T0285's level picker shows a multiplier and a harder run; this slice makes the promise real: the chosen level augments scale the run's score and coins, and the player sees the multiplier where the run pays (claim, end card, leaderboard) and while it runs (a chip under the stats card).

## Details
- **The multiplier pays:** the run multiplier (the levelMultiplier of the run's chosen set, T0285's core/levels.ts) scales the run's final score and the coins it pays, both rounded down. It stacks multiplicatively with Iron's doubled coins: Iron + Tough pays coins ×2.5 and score ×1.25. A run with no level augments on is byte-identical today (×1.0). The coin formula (T0001's coinsForRun) carries it as a factor, so the live coin tally (T0013) and the pause's worth line (T0087) pick it up with no new readout.
- **The claim card (RewardsScene):** the score and coins lines show the multiplied values; under the "+N coins" line, one new muted line "×1.25 level augments" (only when the multiplier is above 1.0) — the one factor both totals wear.
- **The end card (GameOverScene):** the score's breakdown line (T0083) keeps its plain terms and gains the factor at the end — "waves +A · stopped +B · ×1.25" — so the terms still sum to the score shown.
- **The leaderboard (the menu's Today / Forever):** an entry records the run's multiplier; a row above ×1.0 wears a small muted "×1.25" tag beside its score (the muted language of the iron star, T0249). Normal rows are unchanged.
- **The HUD:** a new small chip row under the stats card, one chip per active level augment — the augment's name, bold 11 px ink on a white chip ~22 px tall, 6 px between chips, hidden when none are on; with five or fewer chips the row fits on one line at 412×915 and 1280×720 (wrap to a second line if ever needed). The chips say names only: the multiplier's effect already rides on the coins tally and the pause worth line, and the menu said the number before the run — nothing shown twice.
- **Unchanged:** the draft, the tech tree, T0285's menu picker, the menu demo (level augments stay off in it), and every run with none on.

## Acceptance criteria
- [ ] A run with Tough on pays coins ×1.25 and score ×1.25 (×2.5 coins with Iron); a run with none on is byte-identical. Unit tests cover the formula with and without Iron and the ×1.0 case.
- [ ] The claim card shows the multiplied score and coins with one muted "×1.25 level augments" line; with none on, no line.
- [ ] The end card's breakdown reads "waves +A · stopped +B · ×1.25" with Tough on, and the terms still sum exactly to the score shown.
- [ ] A leaderboard row from a level-augment run wears the small "×N" tag; a normal run's row is unchanged.
- [ ] During a run with Tough on, one chip "Tough" sits under the stats card; with none on the chip row is absent; both viewports still fit with no overlap (the layout check, T0226).
- [ ] A run closed and resumed pays the multiplied values (the multiplier rides on the saved run's set, T0285's save).
- [ ] npm run check and the desktop/mobile smoke pass.

## Design (architect, desktop)

### Files
- create `src/ui/hud/LevelChips.ts` - HUD part: one chip per level augment on for the run, under the stats card; hidden when none
- edit `src/core/levels.ts` - add `levelMultiplierTag(mul)` (a stored multiplier as '×1.25')
- edit `src/core/profile.ts` - `RunResult.levelMul?`, `coinsForRun` gains a 4th `levelMul = 1` factor and one `Math.floor` at the end, `recordRun` passes it through
- edit `src/core/run.ts` - add `finalScore` getter next to `score`/`levelHpMul`
- edit `src/ui/hud/StatsCard.ts` - pass `game.run.levelHpMul` as the 4th arg of `coinsForRun` (line 63)
- edit `src/scenes/PauseScene.ts` - same, line 65 (the worth line)
- edit `src/scenes/GameOverScene.ts` - show `run.finalScore`, append ` · ×1.25` to the score recipe when `run.levelHpMul > 1`, add `levelMul: run.levelHpMul` to the `recordRun` result
- edit `src/scenes/RewardsScene.ts` - `this.score = run.finalScore`, factor appended to `scoreRecipe`, new muted line under the "+N coins" line, `levelHpMul` in the fallback `coinsForRun` call
- edit `src/scenes/HudScene.ts` - import + one line: `new LevelChips(this, game)` right after `new StatsCard(this)` in `parts`
- edit `src/net/boards.ts` - `RunForBoards.mul: number`, `BoardEntry.mul?: number`
- edit `src/ui/boardsLine.ts` - `submitRun({... , mul: run.levelHpMul })`
- edit `src/scenes/BoardsScene.ts` - `addRow`: small muted `×N` tag beside the score when `e.mul > 1`, score shifts left by the tag
- edit `tests/core/profile.test.ts`, `tests/core/run.test.ts`, `tests/core/levels.test.ts` - unit tests

### Interfaces
```ts
// core/profile.ts
export interface RunResult { /* unchanged */ mul?: number; levelMul?: number; /* new */ }
export function coinsForRun(result: RunResult, cleanPay?: number, mul?: number, levelMul?: number): number;
// returns Math.floor((result.waves + Math.floor(result.stopped / 10) + result.clean * cleanPay) * mul * levelMul)
// recordRun: coinsForRun(result, cleanWavePay(old.purchased), result.mul ?? 1, result.levelMul ?? 1)

// core/run.ts (after the levelHpMul getter)
get finalScore(): number { return Math.floor(this.score * this.levelHpMul); }

// core/levels.ts
export function levelMultiplierTag(mul: number): string; // `×${mul.toFixed(2).replace(/0$/, '')}` → '×1.25'

// net/boards.ts
export interface BoardEntry { rank: number; name: string; score: number; waves: number; mul?: number; }
export interface RunForBoards { name: string; waves: number; kills: number; seed: number; mul: number; }

// ui/hud/LevelChips.ts
export class LevelChips implements HudPart {
  constructor(scene: Phaser.Scene, game: GameScene);
  layout(width: number, height: number): void;
  update(game: GameScene): void; // no-op
}
```
LevelChips body: constants `CHIP_H = 22`, `CHIP_GAP = 6`, `TOP = 12 + 72 + 6` (stats card is 12..84). Constructor: for each `game.run.level` id (fixed for the run — set at `GameScene.ts:104` or restored at `RunSave.ts:66`, both before the HUD launches at `GameScene.ts:174`), skip if `getLevelAugment(id)` is undefined, else `label = scene.add.text(0,0, def.name, textStyle(11, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5)`, `w = Math.ceil(label.width) + 16`, `card = makeCard(scene, 0, 0, w, CHIP_H, CHIP_H / 2)` (makeCard marks it for the T0226 layout check); keep `{ card, label, w }[]`. `layout(width)`: cursor `x = EDGE, y = TOP`; per chip, if `x + w > width - EDGE && x > EDGE` then `x = EDGE, y += CHIP_H + CHIP_GAP`; place card and label at `(x + w/2, y + CHIP_H/2)`; `x += w + CHIP_GAP`. Empty list → no objects, nothing to place.

### Steps
1. `core/levels.ts`: add `levelMultiplierTag` under `levelMultiplierLabel`.
2. `core/profile.ts`: add `levelMul?` to `RunResult` (comment: "the chosen level augments' multiplier on the payout (1 with none on)"), 4th param + single `Math.floor` in `coinsForRun` (update its doc comment: "…then the mode's multiplier (2 for Iron), and the level augments' multiplier, over the whole sum, rounded down"), pass-through in `recordRun`.
3. `core/run.ts`: `finalScore` getter after `levelHpMul`.
4. Call sites: `StatsCard.ts:63`, `PauseScene.ts:65`, `RewardsScene.ts:76` — append `, game.run.levelHpMul` (or `run.levelHpMul`).
5. `GameOverScene.ts`: line 41 → `` `${run.finalScore} points · ${run.kills} kills` ``; line 42 recipe text → `` `waves +${run.wavesCleared * 100} · stopped +${run.kills}${run.levelHpMul > 1 ? ` · ${levelMultiplierLabel(run.level)}` : ''}` ``; line 28 result object → add `levelMul: run.levelHpMul`; import `levelMultiplierLabel` from `'../core/levels'`.
6. `RewardsScene.ts`: line 75 → `run.finalScore`; line 119 `scoreRecipe` gets the same ` · ×1.25` suffix; after `coinRecipe` add `const levelLine = run.levelHpMul > 1 ? recipe(`${levelMultiplierLabel(run.level)} level augments`) : undefined;`; in the `rows.push` at 141-147 insert `if (levelLine) rows.push({ height: levelLine.height, after: gapSmall });` between the coinText and coinRecipe rows; after `i++;` at line 170 add `if (levelLine) levelLine.setY(top + col.ys[i++]);`; `if (levelLine) parts.push(levelLine);` in the parts array.
7. Boards: `net/boards.ts` fields; `ui/boardsLine.ts:56` add `mul: run.levelHpMul`; `BoardsScene.addRow` — before the `this.listBox.add([...])` add `const tag = e.mul !== undefined && e.mul > 1.0001 ? this.add.text(right - 54, y, levelMultiplierTag(e.mul), style(11, false, PALETTE.muted)).setOrigin(1, 0.5) : undefined;` and `const scoreX = right - 54 - (tag ? tag.width + 6 : 0);`, use `scoreX` for the score text (replacing `right - 54`), then `if (tag) this.listBox.add(tag);`.
8. `ui/hud/LevelChips.ts` + the two `HudScene.ts` lines.
9. Tests, then `npm run check`.

### Pitfalls
- Floor exactly once, at the very end, after both multipliers (flooring a term first changes results); `Math.floor(x * 1)` keeps every ×1.0 run byte-identical — the existing `profile.test.ts` expectations must still pass untouched.
- Never touch `RunResult.mul` (Iron's 2): `ironBestWave` keys on `result.mul === 2` alone, so a Tough+Iron run still counts for the Iron record.
- `levelLine` is a `create()`-local, not a field — the RewardsScene instance is reused between runs and a line from a Tough run must not linger (the `ironTag` reset exists for exactly this).
- LevelChips builds once in the constructor: `run.level` is final before the HUD scene exists (new, ghost and resumed runs alike); rebuilding in `update()` would leak objects every frame.
- Chips are screen-space CSS pixels under the stats card (y 90..112); the left column is empty there until the hand bar (y ≥ 620 at 1280×720, ≥ 815 at 412×915), and the wrap keeps rows inside `width - EDGE`.
- Boards: the server may not echo `mul` yet, so `BoardEntry.mul` is optional and the tag simply doesn't appear; rows with `mul` ≤ 1 (or missing) keep the score at exactly `right - 54` — normal rows byte-identical.
- Smoke mode skips the menu, so a Tough run in smoke comes from a pre-seeded localStorage profile (`levelSlots: 1, levelOn: ['tough']`) before navigation — no new URL flag.

### Tests
- `tests/core/profile.test.ts`: new cases next to the Iron one — `coinsForRun({waves:12,stopped:148,clean:5,seed:1,bgen:2}, 1, 1, 1.25)` → 38 (floor 38.75); `(..., 1, 2, 1.25)` → 77 (Iron+Tough, floor 77.5); `({waves:0,stopped:19,clean:0,...}, 1, 1, 1.25)` → 1; `(..., 2, 1, 1)` → 36 (×1.0 identical); `recordRun(memory(), {waves:12,stopped:148,clean:5,seed:1,bgen:2, levelMul:1.25}).coins` → 38 and with `mul: 2` → 77; `levelMul: 1` run stores `lastRun.coins` 31.
- `tests/core/run.test.ts`: run at wavesCleared 1, kills 31 (score 131): `finalScore` 131 with no level, 163 after `run.level = ['tough']` (floor 163.75).
- `tests/core/levels.test.ts`: `levelMultiplierTag(1.25)` → `'×1.25'`, `levelMultiplierTag(1.5)` → `'×1.5'`.
