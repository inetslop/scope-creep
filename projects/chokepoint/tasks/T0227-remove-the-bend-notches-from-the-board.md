---
id: T0227
title: Remove the bend notches from the board
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T17:59:52Z
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

## Design (architect, yoga)

### Files
- edit `src/art/board.ts` - delete the "Bend notches" block (lines 72–97) and drop `kindAt` from the `core/map` import (line 4)
### Interfaces
None (removal only; `paintBoard`'s signature and the file's exports are unchanged).
### Steps
1. In `src/art/board.ts`, delete the whole "Bend notches" block: from the comment `    // Bend notches: one flat muted tick on every build cell that touches a bend of the road.` (line 72) down to and including the closing `    }` of the outer `for (let i = 1; i < map.path.length - 1; i++)` loop (line 97). After the edit, exactly one blank line must separate the road block's `ctx.restore();` (line 70) from the `    // Gates:` comment — delete the block plus one of the two surrounding blank lines.
2. Change line 4 from `import { kindAt, type GameMap } from '../core/map';` to `import type { GameMap } from '../core/map';` (`kindAt` is used only in the removed block, at line 81; `GameMap` is still used by `paintBoard`'s `map: GameMap` parameter).
3. Run `npm run check`; it must pass (no unused-import lint error, no type error).
### Pitfalls
- Do not also delete the road block's `ctx.save(); setShadow(ctx, 0.7); ... ctx.restore();` pair (lines 64–70) — that is the road's shadow, not the notches; and do not touch the gates block that follows.
- Leave `GameMap` in the import (still used); removing it breaks the typecheck. Leaving `kindAt` in fails lint.
- Change nothing else in the file: island, grid dots, rocks, road and gates must stay byte-identical; the texture is painted once per run, so the edit shows on every new board automatically.
- Do not touch `planning/IDEAS.md` or `planning/ROADMAP.md` — the dev agent has no write access to `planning/`; those notes (notches removed at the player's request; T0140 marked removed) are for the product owner to make at review.
### Tests
none (art task)
