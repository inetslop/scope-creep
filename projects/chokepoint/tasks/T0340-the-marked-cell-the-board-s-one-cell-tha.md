---
id: T0340
title: "The marked cell: the board's one cell that makes its tower stronger"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T05:06:52Z
claimed_at: 2026-11-01T05:27:04Z
epic: E13
designer: desktop
---

## Goal
Every board gets one marked build cell: a tower built on it deals +25% more damage. The board preview shows where it is before the run, so every island has a power cell to weigh against placement — a build that held one island fails on the next for a new reason (E13).

## Details
- **The cell:** every generated board has exactly one marked cell, chosen from its free build cells by the board's seed (same seed, same cell; never a road cell or a rock). It may coincide with the guaranteed choke cell — the choke shows nothing, so nothing conflicts.
- **The effect:** a tower built on the marked cell deals +25% damage: its per-hit damage and its beam's per-second rate are ×1.25; range, attack rate, gold, burn ticks and control durations are unchanged. A support tower with no damage of its own (Rally, Frost, Anchor, Push, Mint, Toll, Haste) gets nothing on the cell. Selling the tower frees the cell; a new tower built on it gets the buff.
- **The look:** a small flat dot in the milestone yellow (the coin's yellow) in the center of the marked cell's face, about a third of the face wide, drawn wherever the board is drawn; it is hidden while a tower stands on the cell (the tower's look wins) and reappears the moment the cell is free again.
- **The pick screen:** each board card's preview shows the dot, and the card carries one muted row — "one cell · +25% damage" — in the level-row language; the row fits the card's text at 412x915 and 1280x720.
- **The tower panel:** no new row. The "≈ N/s" line for a tower on the cell reads ×1.25 the same tower's line off the cell — the pure dps formula gains the cell factor as one more term, with unit tests next to its existing ones.
- **No save field:** the marked cell is derived from the board seed; a resumed run re-derives the same cell and a tower on it is still buffed.
- **Why the screen has room (board bar):** the dot is the one visible expression of a cell that changes the rules — without it the +25% is invisible and the placement decision the cell is about cannot be made; it is not a hint, a teach or a decoration, and it replaces nothing (the guaranteed choke shows nothing).

## Acceptance criteria
- [ ] Every fresh board shows exactly one yellow dot on a build cell's face; generating the same seed twice shows it on the same cell; road cells and rocks never carry it.
- [ ] A Common Bolt (12 damage) built on the marked cell hits for 15 per shot; the same Bolt on any other cell hits for 12.
- [ ] A Beam tower (14 per second) on the marked cell deals 25% more per second than the same tower off the cell (14 → 17.5 per second, in the beam's own ticks).
- [ ] A support tower (Rally, Frost, Anchor, Push, Mint, Toll or Haste) on the marked cell behaves exactly as off it.
- [ ] While a tower stands on the marked cell the dot is hidden; selling that tower brings the dot back on the free cell.
- [ ] The pick screen's board cards show the dot in the preview and the muted row "one cell · +25% damage"; the card still fits its text at 412x915 and 1280x720.
- [ ] The tower panel's "≈ N/s" line for a tower on the cell is 1.25× the same tower's line off the cell, all else equal; the pure formula's unit tests cover the cell factor.
- [ ] Closing the tab mid-run and resuming leaves the marked cell on the same cell, with a tower on it still dealing +25%.
