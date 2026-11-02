---
id: T0407
title: "The island's drop-in: a new board settles into place"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T05:22:32Z
---

## Goal
A new run's board arrives with a moment: the island settles into place with a soft drop-in, so "every run is a new board" is felt at the run's open, not just noticed.

## Details
- When a run opens on a freshly generated board (a new Play or Iron run from the menu, or a Ghost run), the board's drawing (the raised island, the road and the rocks) plays a one-time settle: the whole board scales from 1.03 to 1.0 around its own center over ~400 ms with a soft bounce (ease-out that overshoots 1.0 by ~2% and settles), in the tower drop-in bounce's language (pillar 5) but for the island.
- The settle is render-only: the board's data (cells, road, rocks, camera bounds, placement hit-testing) is unchanged, and the scale reaches exactly 1.0 before the first build phase's countdown starts. No per-cell or per-frame work on the board's data during the settle — one transform on the drawing.
- The settle plays once per new board: a resumed run (the save restore) shows no settle — the board is already there.
- The menu's live demo board never settles: the demo is the menu's furniture, not a new board arriving.
- No new sound, no mark painted on the board, no HUD change: the moment is the motion itself, seen under the first draft's cards.

## Acceptance criteria
- [ ] A new run from the menu (Play, Iron or a Ghost run) shows the island settling from 1.03 to 1.0 with a soft bounce over ~400 ms, once, at the run's open.
- [ ] A resumed run shows no settle; the board draws exactly as before the change.
- [ ] The menu's demo board never settles.
- [ ] The board's cells, road, rocks and tower placement hit-testing are unchanged: a placement made after the settle lands on the same cell as it would on the un-animated board.
- [ ] The settle holds 60 fps on a mid-range phone: one transform on the board's drawing, no per-cell work per frame.
