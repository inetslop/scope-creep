---
id: T0415
title: "The history card's records: the device's best marks, at the card's foot"
size: M
priority: 2
status: designing
depends_on: [T0410]
attempts: 0
created: 2026-11-02T09:13:56Z
claimed_at: 2026-11-02T09:52:20Z
epic: E18
designer: cachyos-x8664
---

## Goal
The history card says the best the device has ever done, not only the last twelve runs: a muted records line at the card's foot — best combo, longest clean streak, most clean waves in one run — so the card is the whole climb's record, one tap away.

## Details
- **The records.** The profile (the card's own store, T0410's files) keeps three all-time records: best combo (the longest kill-combo chain of any run), longest clean streak (the most clean waves in a row in one run), and most clean waves in one run. Each recorded run updates each record to the max of the stored value and that run's ledger's own value. The ledger already carries two of the three (the best combo, the clean count); the longest streak is one new field: the max over the run of the ledger's existing streak counter.
- **The line.** The history card gains one muted line at its foot, under the twelve run lines, in the card's own muted style: `records · combo ×N · streak N · clean N` — N each record, "×" only on the combo. Plain muted text, no star, no count-up: the card's run lines are quiet and the records line is quieter still.
- **Empty profiles.** The line is hidden until at least one record is above 0 — an old save without the fields loads them as 0 and shows the card exactly as T0410 left it.
- **It fits.** One line in the muted 12–13 px style; with three-digit numbers in all three marks it fits the card at 412x915 and 1280x720, the card growing the one line the way the twelve run lines fit.
- The claim card's per-run "Best combo ×N" line and the profile card's lines are untouched — the records line is the only place the all-time marks live.

## Acceptance criteria
- [ ] After two runs where the second has a bigger combo, a shorter streak and more clean waves, the line shows the second run's combo, the first run's streak, and the second run's clean count — each the all-time max, not the last run's values.
- [ ] A fresh profile (no records) shows the history card exactly as before this task, and an old save without the records field loads with all three at 0 and no line.
- [ ] The line fits its card at 412x915 and 1280x720 with 99 in all three marks.
- [ ] No other screen shows an all-time combo, streak or clean count before this task (the claim's combo line stays per-run).
