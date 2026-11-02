---
id: T0412
title: "The light move: the tower branch's third node, a move's fee 30% instead of 60%"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T08:58:13Z
epic: E16
---

## Goal
The tower branch gets its third node: for 155 coins between runs, moving a misplaced tower costs 30% of its slots' gold instead of 60% (the floor and the 5-gold minimum stay), so repositioning against the wave preview keeps being a real decision and stops being a tax for players who do it.

## Details
- A third node on the tech screen's "The tower" branch, under Soft sell and The rich cell: "The light move," 155 coins by the depth rule (the branch's 30 base at depth 3), bought once, on for every run after. Its card line: "a move costs 30% of its slots, not 60%."
- While owned, every move's fee is 30% of the tower's slots' cost, floored, minimum 5 — the move's own rule at the new rate (60% when not owned). The panel's "Move · −N" line reads the live fee, so it shows the smaller number while owned, and the ✓ pays exactly what the line says; the −N chip, the slide, the drop-in bounce and the blip are the move's own, unchanged.
- No new screen element, key or sound; a normal or Iron run that never moves is byte-identical, and the fee reads the node's owned state at run start (a run started after the buy uses 30% throughout).

## Acceptance criteria
- [ ] The tech screen's "The tower" branch shows a third node, "The light move," at 155 coins; buying it spends the coins and marks it owned like the branch's other nodes.
- [ ] With the node owned, the Move line and the fee paid read 30% of the tower's slots' cost, floored, minimum 5 (a tower whose slots cost 100 moves for 30, not 60; a small tower still floors at 5); without it, the fee is the current 60% rule, unchanged.
- [ ] A move while owned pays the smaller fee with the move's own feedback (chip, slide, bounce, blip) unchanged, and a resumed run uses the fee of the node's current owned state.
- [ ] Unit tests cover the fee owned vs not-owned for a small tower (the 5 floor) and a large one, and the branch's depth price reads 155; the fee tests sit with the move-fee's tests, where T0394's fee tests live.
