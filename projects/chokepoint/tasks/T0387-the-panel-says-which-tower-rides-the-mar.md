---
id: T0387
title: The panel says which tower rides the marked cell
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T23:16:36Z
claimed_at: 2026-11-01T23:16:54Z
epic: E16
designer: yoga
---

## Goal
The tower panel shows the marked cell's buff on the tower that stands on it: the cell's painted dot hides under a built tower and nothing on screen today says a selected tower is buffed, so a first-time player cannot tell a 1.25× tower from a plain one mid-run.

## Details
- A new muted line in the tower panel (the selected tower's white card above the hand, `src/ui/hud/TowerPanel.ts`), in the panel's own muted-read style (the kills line and the ≈N/s DPS line are the closest examples): shown only while the selected tower stands on the board's marked cell (the tower's own cell multiplier, the `cellMul` the tower already carries, is above 1).
- The line reads "marked · +25% damage" — the +N derived from the tower's live buff ((cellMul − 1) × 100, rounded: 25 at the plain 1.25×, 50 once The rich cell's node raises the cell to 1.5×, T0386) — never a hard-coded number, so the node's effect shows on the tower without any further task.
- No other change: the cell's painted dot, the pick screen's "one cell · +N% damage" line and the boards reference are untouched; a tower off the marked cell shows no line; the panel's rows grow to fit their text as they already do.
- Nothing shown twice: the dot marks the cell on the board and the pick screen says it before the run; this line is the first place the number rides on the tower itself, next to the tower's own stats.

## Acceptance criteria
- [ ] Selecting a tower that stands on the marked cell shows exactly one new muted line, "marked · +25% damage" (plain board, node unbought), in the kills/DPS lines' own style; selecting any other tower or closing the panel shows nothing new.
- [ ] With The rich cell owned (T0386), the same line on a marked-cell tower reads "marked · +50% damage" — read from the tower's live buff, nothing hard-coded.
- [ ] Every other panel line (augment cards, stats, kills and DPS lines, slots, the sell line and its price) and the cell's painted dot are byte-identical to before; the card fits at 412x915 and 1280x720 with the line showing.
- [ ] The game is playable menu to game over on desktop and mobile, including a resumed run with a tower on the marked cell.
