---
id: T0227
title: Remove the bend notches from the board
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T17:59:52Z
claimed_at: 2026-10-29T18:00:07Z
designer: yoga
---

## Goal
The player asked for T0140's bend notches to go. These are the short muted dashes painted on every build cell around a bend of the road. They clutter the board: a scatter of slanted and straight dashes around every bend, in the same dark ink as the towers' details. They are also misleading: they mark the cells on the outside of a bend too, and those are not worth more. Remove them. The board teaches where to build through the hover preview's range ring, which is already there.

## Details
- In `src/art/board.ts`, remove the "Bend notches" block in the board painter: the `notched` set and both loops that paint a tick per bend-adjacent cell.
- Remove any import that only that block used (`kindAt` from `../core/map` is used only there; check before removing), so lint stays clean.
- Nothing else changes: the island, the grid dots, the rocks, the road and the gates look exactly as before, and no rule changes (the notches were never part of a rule).
- **For the product owner, when you review this task:** in `planning/IDEAS.md`, note that the bend notches were removed at the player's request (clutter, and they marked the bend's outer cells too), so permanent marks on the board's cells are not proposed again. In `planning/ROADMAP.md`, mark T0140 as removed.

## Acceptance criteria
- [ ] A new board shows no dashes on the build cells beside bends; everything else on the board looks the same.
- [ ] `npm run check` passes (no unused import left behind).
