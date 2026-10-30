---
id: T0276
title: "Endless rerolls: every reroll costs more"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T09:47:06Z
claimed_at: 2026-10-30T10:09:08Z
epic: E4
designer: desktop
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
