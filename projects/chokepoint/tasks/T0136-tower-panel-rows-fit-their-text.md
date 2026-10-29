---
id: T0136
title: "Tower panel: augment rows grow to fit their text"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-29T09:46:49Z
---

## Goal
In the tower panel, an augment row's description spills out of the bottom of its white card when it wraps to two lines (seen on a Beam tower: "A second beam on the nearest enemy: 3 per second." ends below the card, over the next row's gap). Every row must hold its whole text inside its card.

## Details
- Where: `ui/hud/TowerPanel.ts`. Each row is a fixed `ROW_H` (64 px) card; the added line starts 12 px below the row's center and word-wraps, so a second line runs past the card's bottom edge.
- Fix: size each row to its content. Measure the wrapped line first; a row is 64 px when the line fits on one line, and grows by one line height (about 14 px at 11 px text) for every extra line, keeping the same 7 px top padding and at least 8 px between the last line's bottom and the card's bottom edge. The tier frame (`drawTierFrame`) and the icon follow the row's real height (icon vertically centered).
- Rows below a taller row move down by the extra height; the panel's total height (`H`) adds up the real row heights, so the kills line, the damage-per-second line and the slot row stay below the last row with their current spacing.
- Don't shorten the card lines or shrink the text: the fix is layout only.
- Check at 412x915 and 1280x720, with the longest card lines in the game (for example Beam, Anchor and Splash added to one tower).

## Acceptance criteria
- [ ] A tower holding Beam and Anchor shows every row's full text inside its card, on desktop (1280x720) and phone (412x915).
- [ ] A row whose line fits on one line is exactly as tall as today (64 px).
- [ ] Nothing below the rows overlaps: the kills line, the damage-per-second line and the slots keep their spacing; the panel's card encloses everything.
