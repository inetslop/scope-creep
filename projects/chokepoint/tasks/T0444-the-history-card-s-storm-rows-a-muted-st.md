---
id: T0444
title: "The history card's storm rows: a muted storm mark"
size: M
priority: 2
status: design
depends_on: [T0403]
attempts: 0
created: 2026-11-02T20:29:42Z
epic: E18
design_attempts: 1
---

## Goal
A storm run's row on the history card says so — a muted "storm" mark in the iron mark's own language — so the climb reads in its modes, not just its waves (E18's last slice).

## Details
- **What exists:** the history card (T0410) lists the last twelve runs, most recent first — each row the run's wave, its coins, a muted "iron" mark on Iron runs, and the small yellow star on the best-wave run. Storm (T0403) is the third mode: a storm run carries it for the whole run the same way it carries Iron, and the claim card already says "Storm" for it.
- **The change:** a storm run's row wears a muted "storm" mark in the iron mark's own language — the same muted style and the same place on the row the iron mark takes (the architect reads T0410's row layout). A row never wears both marks: the storm is its own mode and is not combined with Iron (T0403), so every run is exactly one of: no mark, "iron", or "storm".
- **The record:** the run record the profile stores already carries the mode for the iron mark; the storm's mode rides that same field (T0403's mode). If the record does not yet carry the mode for storm runs, this task adds it there — nothing else on the record changes.
- **Nothing else:** no new card, no new button, no new scene; the profile card, the claim card and the menu are untouched; the card's other rows (wave, coins, the best-wave star) are byte-identical.

## Acceptance criteria
- [ ] A storm run's row on the history card shows the muted "storm" mark in the iron mark's language; a normal run's row shows no mark; an Iron run's row still shows only the "iron" mark.
- [ ] No row ever shows both marks.
- [ ] The card's layout, its wave/coins rows, the best-wave star, the profile card and the claim card are byte-identical; the card fits at 412x915 and 1280x720.
- [ ] `npm run check` and the desktop + mobile smoke pass.
