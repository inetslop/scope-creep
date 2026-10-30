---
id: T0310
title: "The switchback: the board branch's fourth node, a fold in the road"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T22:00:22Z
epic: E9
---

## Goal
A fourth node on the tech tree's board branch: when owned, every new board's road folds back on itself — one long straight stretch running parallel to another, a cell of island between. The island visibly gains a corridor of double cover, and the branch's depth-4 price (T0288) has something worth its 80 coins.

## Details
- **The node.** The board branch's fourth card, below "Two chokes" (T0297). Name: **The switchback**. Card line, dry one-liner: "The road folds back: a cell between two stretches." Price is the depth-4 value of T0288's formula (80 coins; the branch's other nodes read 10, 30, 50). Buying, the owned mark and persistence work exactly like the branch's other nodes.
- **The fold (the board rule).** With the node owned, the generated board's road gains one fold: a straight stretch of 3 to 5 road cells running parallel to another straight stretch of the road, with one cell of island between them (the strip cells are ordinary build cells), located in the middle third of the path — between 33% and 67% of the total path length from the entrance gate.
  - **A detour, not a fork.** Every enemy still walks the one road from the entrance gate to the exit gate. No second entrance, no enemy choice, and the spawn schedule, the "furthest along" progress and the gates are unchanged.
  - **Both orientations.** The fold exists on landscape (14x8) and portrait (8x14) boards, grid-aligned, with no bend cell inside either fold stretch.
  - **Nothing painted.** The strip cells are unmarked like every other cell (the board's own rule: no marks on the board). A tower placed in the strip has its range ring cover both stretches, so the corridor reads from the road and the ring — a first-time player sees a place where every tower covers two stretches of road without being told.
  - **The choke is untouched.** The board still has exactly one guaranteed choke cell (T0217); if it lands inside the strip, it is just one of the corridor's cells. Rocks, bend count, path length class and the entrance/exit generate as today; a board without the node is byte-identical to today's.
  - **The generator always succeeds**, with the same relax/retry discipline as the bend and choke placements: stretch length first (down to 3), then the gap (a two-cell strip, still double cover for every tower in the pool — every tower's range is 1.7 cells or more), then the position (anywhere on the path, still straight, still parallel, still inside the middle third when possible).
- **The player experience.** After the buy, every new run — and every ghost run, the fold's position driven by the board's seed — shows the fold: the road running alongside itself mid-board, a strip of buildable island between the two stretches. No new text, no new HUD element, no new board mark, no sound.
- **Why placing gets more interesting:** the board gains one obvious strong zone that was not there — the corridor — so the middle of the run has a visible answer, and the strip's extra cells room out the choke's neighbourhood (T0217, T0297) when the two sit close.
- **Closest example to build from:** the "Two chokes" node (T0297) — a new board-generation guarantee, a node card on the branch, and a pure seeded test.

## Acceptance criteria
- [ ] The tech tree's board branch shows a fourth card — "The switchback", 80 coins at depth 4 — below "Two chokes"; buying it spends the coins, wears the owned mark, persists across sessions and reads in the node's usual places.
- [ ] With the node owned, every generated board (both orientations, any seed) contains a fold: a straight 3-5 cell stretch parallel to another straight stretch, a 1- or 2-cell island strip between (the generator prefers 1), inside the middle third of the path; every enemy still walks the single road from entrance to exit.
- [ ] Every strip cell is buildable and unmarked; a range ring on one covers both stretches; the board still has exactly one guaranteed choke cell (T0217); a board of the same seed without the node is byte-identical to today's.
- [ ] A seeded unit test (both orientations, a spread of seeds) asserts the fold's presence and bounds with the node owned and its absence (byte-identical boards) without it; the desktop and mobile smoke tests pass.
