---
id: T0291
title: "The payout: the level multiplier pays"
size: L
priority: 1
status: design
depends_on: [T0285]
attempts: 0
created: 2026-10-30T17:15:59Z
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
