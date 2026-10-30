---
id: T0285
title: "Level augments I: the unlock, the menu picker and Tough"
assignee: inet-racing
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T12:31:05Z
claimed_at: 2026-10-30T14:55:24Z
epic: E9
---

## Goal
A player who has seen wave 30 can make future runs harder on purpose and is promised a bigger payout for it: the menu grows a level picker, and this slice lands its unlock, its slot cap and its first augment, Tough.

## Details
- A level augment is a pre-run switch, not a pool augment: it never appears in the draft, the hand, on a tower or in the codex, and it does not count toward the 16-augment pool. It is a run rule, like Iron's mode, chosen before the run starts.
- **The unlock:** the first time a finished run — normal or Iron — reaches wave 30, the profile gains one level slot (a new count on the saved profile, written with the run's result, and it never decreases). A run counts once its wave number reaches 30 — wave 30 has started; a run that dies during wave 30 counts. A run that ends below wave 30 leaves the count at 0.
- **The menu card:** the start screen grows one small white card under the Iron card (the even-column fit-sum, T0222; it must fit without scrolling at 412x915 and 1280x720 in both states):
  - With 0 slots, the card is one muted line: "Level — reach wave 30 to unlock". Nothing else.
  - With slots, a bold "Level" header and one chunky row per level augment — this slice only **Tough** — in the pause Sound row's pattern (T0035): the name "Tough", its plain line "enemies +25% health", and an On/Off state; the whole row is one tap target.
  - The picker is capped at the slot count (a pure rule, unit-tested): with N slots at most N augments are on. With one slot and one augment in the set the cap cannot bite in play, but a row that is off while the slots are full must dim and its state word must read "full" (the buy-slot button's quiet language).
- **The choice is kept:** the chosen set is saved in the profile and preselected for the next run; the run's save records it, so a run closed and resumed keeps its choices.
- **Tough (pure rule, unit-tested):** while on, every enemy in the run has 25% more health than the same seed and wave would otherwise give (on top of the wave's own per-wave growth), from wave 1 to the last. Mix, spawn order, speed, gold and the wave's plan are unchanged — Tough is health only. A run with Tough off is byte-identical to today.
- **The multiplier, shown:** the chosen augments' bonuses add up into one run multiplier, shown on the card before starting — "×1.25" with Tough on, a muted "×1.0" with none on. In this slice it is shown and saved but not yet applied to score or coins (the payout is the next slice). The menu's multiplier is the pre-run choice; the pause's "worth +N coins" (T0087) is the live run — different screens, nothing shown twice.
- No level numbers, no board re-growth, no level-clear moment anywhere: this is pre-run difficulty, not the removed E3 levels.

## Acceptance criteria
- [ ] A profile with 0 slots shows the Level card as the single muted line "Level — reach wave 30 to unlock"; no rows, no multiplier.
- [ ] A run (normal or Iron) whose wave number reaches 30 writes 1 to the profile's slot count, once; the count never decreases; a run ending on wave 29 leaves it at 0.
- [ ] With 1 slot the card shows the Tough row; a tap flips On/Off; the choice is preselected on the menu for the next run and survives a run closed and resumed.
- [ ] A run started with Tough on: every enemy's health is 25% above the same seed and wave with it off (pure function, unit-tested); with it off the run is byte-identical to today.
- [ ] The card shows "×1.25" with Tough on and a muted "×1.0" with none on, before the run starts; the run's score and coins are not yet scaled by it.
- [ ] The start screen still fits without scrolling at 412x915 and 1280x720, with the card in both its states.

## Design (architect, desktop)

### Files
- create `src/content/levels/tough.ts` — Tough's `LevelAugmentDef` (`id: 'tough'`, `name: 'Tough'`, `line: 'enemies +25% health'`, `bonus: 0.25`).
- create `src/content/levels/index.ts` — `LEVEL_AUGMENTS: readonly LevelAugmentDef[] = [tough]` + `getLevelAugment(id): LevelAugmentDef | undefined`. NOT added to `AUGMENTS` in `content/augments/index.ts`: level augments never enter draft, hand, tower or codex.
- create `src/core/levels.ts` — pure rules (below).
- create `src/scenes/menu/LevelCard.ts` — `buildLevelCard()` (below), model on `scenes/menu/ProfileCard.ts`.
- create `tests/core/levels.test.ts` — the pure rules + Tough's health rule.
- edit `src/content/types.ts` — add `LevelAugmentDef` interface right after `AugmentDef` (line 229).
- edit `src/core/profile.ts` — `Profile.levelSlots: number` + `Profile.levelOn: string[]` (parse in `loadProfile`, validate ids via `getLevelAugment`, default `0`/`[]`, include in the catch-all fallback); `RunResult.reached?: number`; `recordRun` sets `levelSlots: levelSlotsAfter(old.levelSlots, result.reached ?? result.waves)`; new `saveLevelOn(store, on)` (mirror `saveSound`).
- edit `src/core/run.ts` — `RunState.level: string[] = []` (mutable, like `mode`) + `get levelHpMul(): number { return levelMultiplier(this.level) }`.
- edit `src/core/saveRun.ts` — `SavedRun.level: string[]`; `loadSavedRun` accepts the field missing (older saves → `[]`) but rejects it when present, non-array, >16, or holding an unknown id; return it.
- edit `src/systems/WaveSystem.ts` — line 73: `this.enemies.spawn(getEnemy(spawn.enemy), plan.hpMul * this.run.levelHpMul)`.
- edit `src/systems/RunSave.ts` — `persist()`: add `level: [...run.level]`; `restore()`: `run.level = saved.level`.
- edit `src/scenes/GameOverScene.ts` — add `reached: run.wave` to the `recordRun` call (NOT `wavesCleared`: a run dying in wave 30 has `wavesCleared` 29 but counts).
- edit `src/scenes/GameScene.ts` — in the `if (!saved)` block: `this.run.level = capLevelChoice(profile.levelSlots, profile.levelOn);` (new/ghost/Play/Iron runs all take the profile's saved set).
- edit `src/scenes/MenuScene.ts` — build the card after the Iron button; add `+ level.height + GAP` to the fit sum after `IRON_H + GAP` (line 169); place it in `layout()` right after the iron `put(IRON_H)` + `gap(GAP)` (lines 215–217); push its container into `fadeIn` after `iron.container`.
- edit `src/debug/runChecks.ts` — one invariant next to `augments.valid`.
- edit `tests/core/profile.test.ts`, `tests/core/saveRun.test.ts` — new cases (below).

### Interfaces
```ts
// content/types.ts
export interface LevelAugmentDef {
  id: string; name: string;
  line: string;      // the card's plain line, e.g. 'enemies +25% health'
  bonus: number;     // added to the run multiplier; for Tough also the enemy-health factor over the wave's own growth
}

// core/levels.ts
export const LEVEL_UNLOCK_WAVE = 30;
export function levelSlotsAfter(old: number, wavesReached: number): number   // max(old, 1) iff wavesReached >= 30, else old
export function capLevelChoice(slots: number, ids: readonly string[]): string[]  // known ids only, first `slots` in order
export function levelMultiplier(ids: readonly string[]): number              // 1 + sum of known ids' bonuses
export function levelMultiplierLabel(ids: readonly string[]): string         // '×1.25' with Tough, '×1.0' with none (trim one trailing 0 of toFixed(2))

// scenes/menu/LevelCard.ts
export interface LevelCard { container: Phaser.GameObjects.Container; width: number; height: number; on: string[]; }
export function buildLevelCard(scene: Phaser.Scene, slots: number, initial: string[], onToggle: (on: string[]) => void): LevelCard
```
`LevelCard` internals: `width` 220 (the Iron card's). With `slots === 0`: a `makeCard` 220×44 pill with one centered muted line "Level — reach wave 30 to unlock" (`textStyle(14, PALETTE.muted)`); nothing else. With slots: card height = `12 + 20 + 10 + LEVEL_AUGMENTS.length * 52 + (LEVEL_AUGMENTS.length - 1) * 6 + 12` (106 for one row); header "Level" (`textStyle(16, PALETTE.ink, { fontStyle: 'bold' })`, origin (0,0.5) at x −98) and the multiplier label right-aligned (x +98, ink bold when > 1, muted when ×1.0); one row per `LEVEL_AUGMENTS` entry, a `makeButton` (196×52, radius 14, label hidden) in the pause Sound row's pattern: name at x −84 y −11 (`textStyle(15, PALETTE.ink, bold)`), its `line` at x −84 y +11 (`textStyle(12, PALETTE.muted)`), state word right-aligned at x +84 — "On" (ink bold) / "Off" (muted) / "full" (muted). A row that is off while `on.length >= slots` calls `setEnabled(false)` (dims to 0.45 and stops reacting — do NOT pass `fadeWhenDisabled: false`). Tap = toggle: removing always; adding only when under the cap; then `onToggle(this.on)` (MenuScene calls `saveLevelOn(window.localStorage, on)` and `sfx.blip()`, with `sfx` from `getSfx(this)`). Height is fixed at create time — toggling never changes it.

### Steps
1. `content/types.ts`, `content/levels/*` (data first, no behavior yet).
2. `core/levels.ts`, then `core/profile.ts` (fields, parse, `recordRun`, `saveLevelOn`).
3. `core/run.ts` (field + getter), `core/saveRun.ts` (save shape + validation).
4. Wiring: `WaveSystem` spawn line, `RunSave` persist/restore, `GameOverScene` `reached`, `GameScene` new-run choice.
5. `scenes/menu/LevelCard.ts`, then `MenuScene` (fit sum, layout, fadeIn, persistence callback).
6. Invariant in `debug/runChecks.ts`: `['level.choice', (g) => (new Set(g.run.level).size === g.run.level.length && g.run.level.every((id) => getLevelAugment(id) !== undefined) ? null : 'unknown level choice')]`.
7. Tests, then `npm run check` and `npm run smoke`.

### Pitfalls
- Byte-identical run with Tough off: `levelMultiplier([])` is exactly 1 and `x * 1 === x`; never touch `planWave` — the plan, mix, order and gold must not move.
- Split/child spawns inherit Tough through `enemy.hpMul` (split.ts, midSplit.ts already feed the parent's factor) — never multiply by the level factor again in a hook.
- `reached` is optional so the existing `recordRun` test call sites keep passing; `GameOverScene` must pass `run.wave`, and a test must pin that `wavesCleared` 29 + `reached` 30 unlocks.
- Older saved runs have no `level` — validation must accept the missing field (as it does `mode`), defaulting to `[]`.
- Menu fit: add the height to the fit sum AND place it in `layout()`; the column already scales (`s`) when tight, so both 412×915 and 1280×720 absorb the ~134 px in both card states.
- Don't register Tough in `AUGMENTS`/`draftPool`/codex; don't scale score or coins with the multiplier (next slice).
- The menu relaunches after every run, so the card always reads the fresh profile (new slots appear without extra plumbing).

### Tests
- `tests/core/levels.test.ts`: `levelSlotsAfter` (29→0, 30→1, repeat 30/40→stays 1, 10 with old 1→1); `capLevelChoice` (0 slots→[], 1 slot with `['tough','nope']`→`['tough']`); `levelMultiplier` (none→1, `['tough']`→1.25, unknown ids ignored) and `levelMultiplierLabel` ('×1.0'/'×1.25'); Tough's health rule: for waves 1–30, `Math.round(dot.hp * waveHpMul(w) * levelMultiplier(['tough'])) === Math.round(dot.hp * waveHpMul(w) * 1.25)` and off equals the base.
- `tests/core/profile.test.ts`: `recordRun` with `reached: 30` writes `levelSlots` 1 once (second wave-30 run keeps 1), `reached: 29` keeps 0, `waves: 29, reached: 30` unlocks; `saveLevelOn` persists and unknown ids are dropped on reload.
- `tests/core/saveRun.test.ts`: a save with `level: ['tough']` round-trips; a save without the field loads with `level: []`; an unknown id makes `loadSavedRun` return undefined.
