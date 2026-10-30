---
id: T0295
title: "Lean and Short fuse: the gold and clock level augments"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T17:33:38Z
epic: E9
---

## Goal
The level picker (T0285) completes its first set: one augment that thins the gold, one that shortens the clock — the last two of E9's "harder in one plain way" rules.

## Details
- Two new level augments, each its own content file beside `src/content/levels/tough.ts` in the same shape (name, plain line, its number, its multiplier bonus):
  - **Lean** — card line "kills pay 25% less gold". The base kill bounty is 75% of normal, floored down, minimum 1 gold (a 1-gold kill still pays 1; 2 → 1, 4 → 3, 8 → 6). The quiet ×2 and the last stand's ×2 then apply to the Lean'd number exactly as they do today, and the gold pop shows the final number. The wave clear bonus, the combo milestone gold, Mint's +1, Toll's leak gold, the Hauler's −5 leak cost and the early-send bank are untouched. Bonus: +25%.
  - **Short fuse** — card line "the build countdown runs 30% shorter". The build countdown is 70% of its normal length, rounded to the nearest second (derived from the same constant the normal build phase uses, so it stays honest if the base moves); the last-three-seconds tick and the big button's banked gold (2 per whole second left) run on the shortened clock as usual. Bonus: +30%.
- Same wiring as Tough and as T0294's two: the picker gains a row for each (capped at the slot count, saved in the profile, preselected for the next run), the run save carries the selection, and the menu's multiplier readout recomputes as 1 + the sum of the selected augments' bonuses: ×1.25 Lean alone, ×1.30 Short fuse alone, ×1.55 both, ×1.80 all four with Tough. The picker card grows to fit the whole set (the menu's fit-sum pattern), at 412x915 and 1280x720.
- The rules are pure, with unit tests beside T0285's `tests/core/levels.test.ts`: the bounty table (1 → 1, 2 → 1, 4 → 3, 8 → 6, the 1-gold floor), the quiet ×2 and the last stand ×2 applied to the Lean'd number, the countdown length, and the bonus summing.

## Acceptance criteria
- [ ] The menu picker lists Lean and Short fuse, each with its number, toggled on and off up to the slot count; the multiplier line reads ×1.25 / ×1.30 / ×1.55 for Lean / Short fuse / both, and ×1.80 with all four.
- [ ] In a Lean run, the kill gold pop shows the 75% number (the test's table), and a quiet wave's ×2 and the last stand's ×2 multiply that number, not the un-Lean'd one.
- [ ] In a Lean run, the wave clear bonus, the combo milestone gold, Mint's +1, Toll's leak gold and the early-send bank are unchanged.
- [ ] In a Short fuse run, the build countdown is 70% of its normal length (asserted on the length in a test), the last-three-seconds tick and the big button's banked gold follow the shortened clock.
- [ ] A resumed run keeps its selection; with both off, the gold and the countdown are byte-identical to today.

## Design (architect, desktop)

### Files
- create `src/content/levels/lean.ts` - Lean's `LevelAugmentDef` (model on `tough.ts`)
- create `src/content/levels/shortFuse.ts` - Short fuse's `LevelAugmentDef`
- edit `src/content/levels/index.ts` - registry: two imports + grow `LEVEL_AUGMENTS` to `[tough, lean, shortFuse]` (next to `tough`, don't re-sort; T0294 adds its rows here too)
- edit `src/core/levels.ts` - add `leanBounty()`, `levelBuildSeconds()`; `levelMultiplierLabel` shows 2 decimals
- edit `src/systems/EnemySystem.ts` - one line in `kill()` (+1 import, update the 3-line comment above it)
- edit `src/systems/RunFlow.ts` - `finishDraft()` derives the countdown via `levelBuildSeconds` (+1 import)
- edit `src/systems/RunSave.ts` - `restore()` does the same (+1 import)
- edit `src/scenes/menu/LevelCard.ts` - one line: word-wrap the row's `def.line` text (36 chars would overflow the row and hit the On/Off/'full' state)
- edit `tests/core/levels.test.ts` - see Tests

Picker rows, card height, profile save/`capLevelChoice`, run save/restore of the selection, `run.level` on new runs (GameScene:104), the `level.choice` invariant, and the multiplier readout are all already generic over the registry — no changes.

### Interfaces
In `src/core/levels.ts` (pure, no Phaser, do NOT import `RunState` — `run.ts` imports `levels.ts`, a cycle):
```ts
/** Lean's kill bounty: 75% of the enemy's own gold, floored down, minimum 1 gold (a 1-gold kill still pays 1). */
export function leanBounty(base: number, levels: readonly string[]): number {
  return levels.includes('lean') ? Math.max(1, Math.floor(base * 0.75)) : base;
}
/** The build countdown with the run's level augments: Short fuse runs 70% of `normal`, rounded to the nearest second. */
export function levelBuildSeconds(normal: number, levels: readonly string[]): number {
  return levels.includes('short-fuse') ? Math.round(normal * 0.7) : normal;
}
```
`levelMultiplierLabel` becomes `` `×${levelMultiplier(ids).toFixed(2)}` `` (drop the `.replace(/0$/, '')`) so the readout shows ×1.25 / ×1.30 / ×1.55 / ×1.80 exactly.

### Steps
1. `lean.ts`: `{ id: 'lean', name: 'Lean', line: 'kills pay 25% less gold', bonus: 0.25 }`. `shortFuse.ts`: `{ id: 'short-fuse', name: 'Short fuse', line: 'the build countdown runs 30% shorter', bonus: 0.30 }`. Same shape/comments as `tough.ts`.
2. `content/levels/index.ts`: add the two imports beside `tough`, extend the array.
3. `core/levels.ts`: add the two functions (place them after `levelMultiplierLabel`); change the label + its doc comment.
4. `EnemySystem.kill()` (line 208) becomes: `const baseGold = killGold(this.run, leanBounty(e.def.gold, this.run.level) * quietGoldMul(this.run.wave));` — Lean thins the bounty BEFORE quiet ×2 and last stand ×2; Mint's +1 and the `+${paid}` pop stay after, so the pop shows the final number. Add `import { leanBounty } from '../core/levels';` beside the `killGold` import (line 7).
5. `RunFlow.finishDraft()` lines 127-129 become: `const base = this.run.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between; const seconds = levelBuildSeconds(base, this.run.level); this.buildTotalSec = seconds; this.run.startBuild(seconds);`
6. `RunSave.restore()` line 85 becomes: `const seconds = levelBuildSeconds(saved.wave === 0 ? BUILD_SEC.first : BUILD_SEC.between, run.level);` (`run.level` is set at line 67).
7. `LevelCard.ts` line 54: `textStyle(12, PALETTE.muted, { wordWrap: { width: 132 }, lineSpacing: 2 })` on the `line` text (one line stays one line; Short fuse wraps to two, which fits `ROW_H = 52`).
8. Tests (below), then `npm run check`.

### Pitfalls
- Don't touch `NextWaveButton.ts`: the last-three-seconds blip (`secs 1..3`), the ring, and the banked-gold badge all read `buildLeftSec`/`buildTotalSec`, so they follow the shortened clock for free. Don't touch wave bonus / combo / Mint / Toll / Hauler / `bankSend` paths — Lean only lives in `EnemySystem.kill()`.
- Rounding is `Math.round` (nearest), not floor: 8s→6s (5.6), 10s→7s.
- Don't assert `LEVEL_AUGMENTS`' exact id array or length in tests — T0294 (swift, crowded) extends the same registry and merge order is unknown; assert per-id via `getLevelAugment`.
- The label change is required by the acceptance values (×1.30/×1.80); it also turns the empty readout from ×1.0 into ×1.00 — update that test line.
- With no level on, `leanBounty(g, [])` returns `g` and `levelBuildSeconds(n, [])` returns `n` — the byte-identical baseline.
- The menu's fit-sum (`MenuScene.layout`) scales the whole column when the 4-row card (height 280) makes it not fit; no MenuScene change.

### Tests
In `tests/core/levels.test.ts` (imports to add: `RunState` from `../../src/core/run`, `killGold` from `../../src/core/lastStand`, `quietGoldMul` added to the existing `core/waves` import, `BUILD_SEC` from `../../src/config`, `leanBounty, levelBuildSeconds` to the `core/levels` import):
- update the label test: `levelMultiplierLabel([])` is `'×1.00'`; add `levelMultiplier(['lean'])=1.25`, `(['short-fuse'])=1.3`, `(['lean','short-fuse'])=1.55`, `(['tough','lean','short-fuse'])=1.8`, label `(['tough','lean','short-fuse'])='×1.80'`.
- replace the "Tough is the one level augment" test with per-id `toMatchObject` checks: tough `('Tough','enemies +25% health',0.25)`, lean `('Lean','kills pay 25% less gold',0.25)`, short-fuse `('Short fuse','the build countdown runs 30% shorter',0.3)`; `getLevelAugment('nope')` undefined.
- bounty table: `leanBounty(1, ['lean'])=1` (floor), `(2)=1`, `(4)=3`, `(8)=6`, `(7)=5`, `(10, [])=10` (off).
- ×2 ordering, mirroring `EnemySystem.kill` exactly: with `new RunState(1)`, `r.lives = 1`: `killGold(r, leanBounty(8, ['lean']) * quietGoldMul(4))` = 24 (not 32); `quietGoldMul(5)` with lean = 12; lean off on wave 4 = 32.
- countdown: `levelBuildSeconds(BUILD_SEC.first, ['short-fuse'])=6`, `(BUILD_SEC.between, ['short-fuse'])=7`, `(..., ['lean','short-fuse'])=7`, both with `[]` return the input.
- untouched paths: `RunState.waveBonus(3)=26` with `r.level=['lean','short-fuse']`; `r.startBuild(7); r.bankSend()=14`.
