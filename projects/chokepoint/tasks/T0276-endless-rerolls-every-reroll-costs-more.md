---
id: T0276
title: "Endless rerolls: every reroll costs more"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T09:47:06Z
claimed_at: 2026-10-30T11:47:02Z
finished_at: 2026-10-30T11:53:19Z
epic: E4
---

## Goal
Today a run gets exactly one draft reroll, for 15 gold. Make rerolls unlimited, but each one costs more than the last. A player who really wants a specific card can keep paying for it, and the rising price is what stops them doing it every draft. The base price goes up to 50.

## Details
- **Price curve:** the nth reroll of the run (n = 0 for the first) costs `50 + 15n + 5n²` gold: 50, 70, 100, 140, 190, 250, 320, 400, 490, 590, … The growth is quadratic: each step costs a little more than the step before (+20, +30, +40, …) but never doubles like an exponential would. Keep it as one pure function next to the config (for example `rerollCost(n)` in `src/config.ts`, replacing `REROLL_COST = 15`), with the three constants named.
- **The count is per run, not per draft:** the price keeps climbing through the whole run and never resets on a new draft. This replaces today's "one per run" budget.
- **Run state:** `RunState.rerollUsed: boolean` becomes `rerollsUsed: number`. `run.reroll()` takes `rerollCost(rerollsUsed)`, fails only if the player can't afford it, and increments the count.
- **Saves:** `saveRun`/`RunSave` store `rerollsUsed`. An old save with `rerollUsed: true` loads as 1 and `false` as 0, so resumed runs don't break or get a free reroll back.
- **Draft screen** (`DraftScene`): the button always shows the current price (never "used"), updates right after each reroll, and is red and disabled when the player can't afford it. The `R` key keeps working for every reroll. A reroll still re-rolls every card in the draft with the existing rules (the opening draft's reroll still excludes the Bolt, and the no-repeat rule against the last offer still holds).
- Remove every "the run's one reroll" comment and doc line, and update any tooltip or pause-screen text that says there is one reroll.

## Acceptance criteria
- [ ] On a fresh run the first reroll costs 50, the second 70, the third 100, and so on along the curve. The price carries over to later drafts without resetting.
- [ ] Rerolling works as many times as the player can pay for. The button turns red and disabled when gold is short and never shows "used".
- [ ] Resuming a run saved with the old `rerollUsed` field gives the right next price (50 if it was false, 70 if it was true).
- [ ] Unit tests: `rerollCost(0..5)` returns 50, 70, 100, 140, 190, 250. The run's reroll charges the right amount and increments the count, fails without charging when gold is short, and the save round-trips `rerollsUsed`, including the old-field migration.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- edit `src/config.ts` — replace `REROLL_COST = 15` (lines 29-30) with named `REROLL` constants and a pure `rerollCost(n)`
- edit `src/core/run.ts` — `rerollUsed: boolean` (line 42) becomes `rerollsUsed: number`; `reroll()` (lines 79-85) becomes argument-less and charges the curve
- edit `src/core/saveRun.ts` — `SavedRun.rerollUsed: boolean` (line 50) becomes `rerollsUsed: number`; validation (line 95) and result (line 122) migrate the old flag
- edit `src/systems/RunSave.ts` — line 48 persists `rerollsUsed`, line 68 restores it
- edit `src/systems/RunFlow.ts` — line 2 import drops `REROLL_COST`; `rerollOffer()` (lines 109-116) calls `this.run.reroll()`
- edit `src/scenes/DraftScene.ts` — line 2 import; button build (lines 200-227): always show the current price, red + disabled when unaffordable, no "used" state
- create `tests/config.test.ts` — unit test for the `rerollCost` curve
- edit `tests/core/run.test.ts` — replace the two reroll tests (lines 84-100) and the `REROLL_COST` import (line 2)
- edit `tests/core/saveRun.test.ts` — `sample()` field (line 25), add migration + broken-count tests

### Interfaces
```ts
// src/config.ts, replacing `export const REROLL_COST = 15;`
/**
 * Draft rerolls, unlimited: the run's nth (n = 0 for the first) costs base + step·n + curve·n²:
 * 50, 70, 100, 140, 190, 250, … — each step costs a little more than the last, but never doubles.
 */
export const REROLL = { base: 50, step: 15, curve: 5 } as const;

/** The price of the run's nth reroll (n = 0 for the first). */
export function rerollCost(n: number): number {
  return REROLL.base + REROLL.step * n + REROLL.curve * n * n;
}

// src/core/run.ts: add rerollCost to the existing `import { BUILD_SEC } from '../config';`
rerollsUsed = 0; // rerolls the run has bought; the next one costs rerollCost(rerollsUsed)
/** Pays for the run's next reroll (it gets dearer with the count); counts it. Fails without charging when the gold is short. */
reroll(): boolean {
  if (!this.spend(rerollCost(this.rerollsUsed))) return false;
  this.rerollsUsed += 1;
  return true;
}

// src/core/saveRun.ts: SavedRun field
rerollsUsed: number; // how many rerolls the run has bought; older saves carried rerollUsed: boolean
// validation, replacing `if (typeof p.rerollUsed !== 'boolean') return undefined;`
const rerollsUsed = inInt(p.rerollsUsed, 0, 1e6)
  ? p.rerollsUsed
  : p.rerollUsed === true ? 1 : p.rerollUsed === false ? 0 : undefined;
if (rerollsUsed === undefined) return undefined;
// and `rerollsUsed,` in the returned object (where rerollUsed was)

// src/scenes/DraftScene.ts, replacing refreshReroll (lines 216-225)
const refreshReroll = (): void => {
  const cost = rerollCost(game.run.rerollsUsed);
  const afford = game.run.canAfford(cost);
  rerollButton.setEnabled(afford);
  rerollPrice.setText(String(cost));
  rerollWord.setColor(cssColor(PALETTE.ink));
  rerollPrice.setColor(cssColor(afford ? PALETTE.ink : PALETTE.red));
  rerollButton.content.setAlpha(afford ? 1 : 0.6);
  centerRow();
};
```

### Steps
1. `src/config.ts`: swap lines 29-30 for the `REROLL` constant + `rerollCost` (exact code above).
2. `src/core/run.ts`: extend the config import to `import { BUILD_SEC, rerollCost } from '../config';`; replace line 42 and lines 79-85 with the new field/method.
3. `src/core/saveRun.ts`: replace the `SavedRun` field (line 50), the validation (line 95) and the returned value (line 122).
4. `src/systems/RunSave.ts`: `rerollUsed: run.rerollUsed` → `rerollsUsed: run.rerollsUsed` (line 48); `run.rerollUsed = saved.rerollUsed` → `run.rerollsUsed = saved.rerollsUsed` (line 68).
5. `src/systems/RunFlow.ts`: line 2 becomes `import { BUILD_SEC } from '../config';`; in `rerollOffer()` replace `if (!this.run.reroll(REROLL_COST)) return false;` with `if (!this.run.reroll()) return false;` and reword the doc comment to "The draft's reroll: pay for the run's next one (the price climbs with the run's count) and re-roll all of the draft's cards."
6. `src/scenes/DraftScene.ts`: line 2 becomes `import { rerollCost } from '../config';`; line 209 initial text becomes `String(rerollCost(game.run.rerollsUsed))`; line 200 comment becomes "The reroll under the cards: pay for the run's next one (it gets dearer each time) and re-roll all of the draft's cards."; replace `refreshReroll` with the version above. Nothing else changes: `reroll()` already calls `refreshReroll()` after each successful reroll, the `R` key path is untouched, and the fixed 156 px button still fits the fullest price (four digits, e.g. "Reroll · 1090" ≈ 130 px of row in a 156 px button) at both 412x915 and 1280x720.
7. Tests (below).
8. `npm run check`, then `npm run smoke`.

### Pitfalls
- Migration precedence: a valid integer `rerollsUsed` always wins; `rerollUsed` is only a fallback for old saves (`true`→1, `false`→0). An old save with junk `rerollUsed` and no `rerollsUsed` must be rejected, not loaded as 0.
- `reroll()` must not increment `rerollsUsed` when gold is short — `spend()` already returns false without charging; rely on it, don't re-check.
- Remove every "one reroll" doc line (config, run.ts, RunFlow, DraftScene). Do NOT touch the "opening reroll" comments in `src/core/augments.ts` — those describe the Bolt exclusion, which still holds. No pause-screen or tooltip text mentions the reroll (verified by search), so there is none to update.
- Don't touch `debug/runChecks.ts` (another task edits it); this change needs no invariant.
- Keep `if (flags.smoke) rerollButton.setEnabled(false);` (line 228) so the smoke run never pays for a reroll.

### Tests
- create `tests/config.test.ts`: `rerollCost(0..5)` equals 50, 70, 100, 140, 190, 250 (and `rerollCost(6)` = 320).
- edit `tests/core/run.test.ts` (import `rerollCost` instead of `REROLL_COST`): replace both reroll tests with (a) "rerolls charge the run's curve and climb" — a loop n = 0..5: set `run.gold = 1000`, expect `reroll()` true, `gold` = 1000 − `rerollCost(n)`, `rerollsUsed` = n+1; (b) "cannot reroll without the gold, and pays nothing" — `run.gold = rerollCost(0) - 1`, expect `reroll()` false, `rerollsUsed` 0, gold unchanged; then one successful reroll, gold set to `rerollCost(1) - 1`, expect false, `rerollsUsed` 1, gold unchanged.
- edit `tests/core/saveRun.test.ts`: `sample()` line 25 becomes `rerollsUsed: 1`; the existing round-trip test now covers `rerollsUsed`; add a test "migrates the old rerollUsed flag to the reroll count": old save with `rerollsUsed` deleted and `rerollUsed: true` loads as `sample()` (1), `rerollUsed: false` loads as `{ ...sample(), rerollsUsed: 0 }`; add broken cases `broken({ rerollsUsed: -1 })`, `broken({ rerollsUsed: 1.5 })`, and a store-level case with `rerollsUsed` deleted and `rerollUsed: 'x'` → `undefined`.

## Result (attempt 1, desktop)

Draft rerolls are now unlimited and get dearer: `REROLL_COST = 15` is replaced by the pure curve `rerollCost(n) = 50 + 15n + 5n²` in `src/config.ts`, the run's one-shot `rerollUsed` flag becomes a per-run `rerollsUsed` count that `run.reroll()` charges against, and saves migrate the old `rerollUsed` boolean (true→1, false→0) into the new `rerollsUsed` field. The draft's reroll button always shows the current price, turns red and disabled when gold is short (never "used"), and updates after every reroll; the R key works for all of them. New unit tests cover the curve, the charging/failure behavior, and the save migration; `npm run check` and desktop + mobile smoke both pass.

- Self-review: APPROVE
- Time: 6.3 min

```
projects/chokepoint/game/src/config.ts             | 12 ++++++--
 projects/chokepoint/game/src/core/run.ts           | 13 ++++-----
 projects/chokepoint/game/src/core/saveRun.ts       |  9 ++++--
 projects/chokepoint/game/src/scenes/DraftScene.ts  | 20 +++++++-------
 projects/chokepoint/game/src/systems/RunFlow.ts    |  6 ++--
 projects/chokepoint/game/src/systems/RunSave.ts    |  4 +--
 projects/chokepoint/game/tests/config.test.ts      | 14 ++++++++++
 projects/chokepoint/game/tests/core/run.test.ts    | 32 +++++++++++++---------
 .../chokepoint/game/tests/core/saveRun.test.ts     | 23 +++++++++++++++-
 9 files changed, 92 insertions(+), 41 deletions(-)
```
