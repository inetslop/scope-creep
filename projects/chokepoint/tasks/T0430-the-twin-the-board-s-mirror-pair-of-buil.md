---
id: T0430
title: "The twin: the board's mirror pair of build cells"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T15:49:41Z
---

## Goal
About a quarter of boards carry a guaranteed mirror pair of build cells, so the run's most open stretch offers a clean either/or placement choice instead of a scatter of cells — the first big decision reads as a decision (Pillar 1) on those boards.

## Details
- About one board in four (a seed-hash decision, exclusive with the fork and the loop — the cove's own exclusivity) carries "The twin": the generator finds the road's longest straight stretch (three or more road-cells) that has buildable room on both sides, and makes the two cells at the stretch's midpoint — one on each side, the same distance from the road — buildable in exact mirror position. If no such stretch has room on both sides, the board simply does not carry the twin.
- What the player sees: two build cells facing each other across the road at its widest straight — a clean "pick one (or build both)" at the most open part of the map. Nothing is painted on or beside them (the board bar: no hint, teach or decoration marks); they read as ordinary cells in mirror positions, and the range ring while placing shows what each reaches.
- The two cells are ordinary build cells: no buff, no cost change. The marked cell and the guaranteed choke are untouched and may sit anywhere, including (rarely) on a twin cell.
- The board's fact line (boardFacts) and the pause's Boards reference (T0350) name it when present — "The twin — a mirror pair of cells on the longest straight" — and stay silent otherwise.

## Acceptance criteria
- [ ] Roughly one new board in four carries The twin: two build cells at equal road-distance on opposite sides of the road, at the midpoint of a straight stretch of three or more cells; boards carrying the fork or the loop never carry it.
- [ ] When present, the board's fact line and the Boards reference name The twin; when absent, neither mentions it.
- [ ] No hint, mark or decoration is painted on or beside the twin cells — they read as ordinary build cells in mirror positions.
- [ ] The twin's cells are ordinary (no buff, no cost change), and a board that does not carry The twin is byte-identical to before this change.
