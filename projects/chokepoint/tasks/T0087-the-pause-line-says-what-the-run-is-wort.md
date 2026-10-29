---
id: T0087
title: The pause line says what the run is worth
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T00:22:08Z
claimed_at: 2026-10-29T00:27:54Z
epic: E1
designer: yoga
---

## Goal
A player who pauses can see what the run is worth in coins right now, not only at the claim card — "rewards that carry over" visible where a run is paused.

## Details
- The pause card (T0030) grows one muted line directly under its run-so-far line, above the controls: "worth +N coins" — N is the run's own coin formula (T0001: waves + floor(stopped ÷ 10) + clean) applied to what has happened so far: waves cleared so far, enemies stopped so far, clean waves so far. Read from the run ledger with the same pure formula the payout (T0001) and the claim card's recipe line (T0075) use — never recomputed a second way.
- Muted gray, the run line's own size (~13 px); the pause card grows by one fixed line height, laid out at 1280x720 and 412x915 like the card's existing lines.
- While the run line reads "Ready" (before wave 1), the worth line is not shown — a run that has not started is not yet worth counting.
- Display only: nothing changes on the ledger, the payout, the claim card or the game-over card. No input, no sound.
- Closest example: the run-so-far line (T0030) for placement and style; the recipe line (T0075) for the formula and its plain-numbers honesty.

## Acceptance criteria
- [ ] Pausing mid-wave-3 with 2 waves cleared, 14 stopped and 1 clean wave shows "worth +4 coins" (2 + floor(14 ÷ 10) + 1).
- [ ] Pausing before wave 1 (the run line reads "Ready") shows the run line only — no worth line.
- [ ] The number grows as the run goes: pausing again after wave 3 has cleared shows the risen value; the claim card's payout and recipe are byte-identical.
- [ ] No input and no sound; desktop 1280x720 and mobile 412x915 smoke pass.
