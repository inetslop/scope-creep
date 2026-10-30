---
id: T0306
title: "The run's summary: the pause's page of the run so far (the T0304 re-file)"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T20:35:44Z
claimed_at: 2026-10-30T20:40:18Z
designer: desktop
---

## Goal
A page of the run so far, off the pause: the claim card's own reads while the run is still going, plus which towers are paying — the check a player wants while deciding what to sell (E7) or where to aim (T0114). Re-filed from T0304 without the "richest minute" line: per-minute gold has no data source, and this task adds no run fields.

## Details
- A "Summary" row on the pause card, in the same row pattern as the Enemies / Waves / Bosses reference rows (T0252, T0264, T0277), with a matching line in the controls list (pillar 8). The pause card already carries the three reference rows; Summary joins them as a fourth in the same pattern — the card grows one row and the layout check verifies the fit.
- Tapping it opens a full-screen white card over the dimmed pause, in the references' pattern; the same back affordance the other references use returns to the pause with its state intact.
- The card's lines, top to bottom — the claim card's own reads, reusing its labels and values, none of which the pause card's run line or "worth +N coins" line already shows:
  - the claim card's first line (waves held)
  - Clean, in the claim card's green, only when the run held at least one clean wave (the claim card's own condition, T0033)
  - Stopped
  - Score with its muted recipe line (the score's own formula, T0083)
  - Best combo ×N — yellow at ×10 and up (the milestone color, T034)
  - the board seed line (T0056, muted)
  - Flawless with the record star, when the claim card's own rule holds so far (every held wave clean, at least one held; T0076)
- Below them, a "By tower" section: one row per tower built this run — the end card's by-tower chip (first augment's icon, tier pip, "×N" kills; T0216, T0228) with the panel's muted "≈ N/s" line (T0084) under it — sorted by kills, highest first; a run with no towers hides the section.
- Every value is read from an existing read (the run ledger, the combo max the claim card reads, the per-tower kills and ≈N/s the panel reads) — no new fields on the run, profile or ledger (T0304's bar, kept). The page is built from the claim card's line data, so when T0291 adds its level-multiplier line to the claim card, the page shows it too as one more line.
- The card grows to its content like the reference cards (a long run's by-tower rows wrap in a column); the longest realistic values fit at 412x915 and 1280x720 (the layout check, T0226, runs in the smoke test).

## Acceptance criteria
- [ ] The pause card shows a "Summary" row in the references' row pattern with a matching line in the controls list; tapping opens the page, and back returns to the pause with its state intact.
- [ ] The page's lines, top to bottom, read the same values with the same labels as the claim card (waves held, clean, stopped, score + recipe, best combo, board seed, flawless-when-earned); no line repeats the pause card's run line (wave, lives, gold, coins) or its worth line.
- [ ] The "By tower" section lists every tower built this run with its chip, kills and "≈ N/s", sorted by kills descending; a run with no towers shows no section.
- [ ] No new fields on the run, profile or ledger: every value comes from an existing read.
- [ ] The page and the pause card with its new row fit at 412x915 and 1280x720 — the layout check passes.
- [ ] The gate (typecheck, lint, unit tests, smoke on desktop and mobile) passes.
