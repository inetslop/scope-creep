---
id: T0459
title: "A cheaper roll: the draft branch's node that starts the reroll 25 lower"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T01:27:12Z
epic: E23
---

## Goal
Between-run coins can buy a cheaper draft reroll: the tech tree's "The draft" branch gains a node that lowers the reroll's cost curve by 25, so a run that rerolls often spends less gold on each one.

## Details
- The node sits on the tech screen's existing "The draft" row (the branch holding Slot II −5, Slot II −5, Fourth card and The early odds) as the branch's fifth node, depth 5: 110 coins by the branch's own depth rule (base 10 — the row's prices read 10, 30, 50, 80, 110). Bought once, on for every run after, like the row's other nodes.
- Today's reroll is unlimited on the curve 50 + 15n + 5n² (n the rerolls already used this run): 50, 70, 100, 140, 190, … With the node owned, every reroll costs 25 less: 25, 45, 75, 115, 165, … (25 + 15n + 5n²). A run's first reroll reads 25 gold instead of 50.
- The draft's reroll button keeps its own look and shows the live price; with the node owned it reads the lowered curve. Without the node the prices are byte-identical to today.
- The node's card wears the row's own card language: the name "A cheaper roll", a description naming the lowered start ("rerolls start at 25 gold: 25, 45, 75, …"), the 110 price, the owned mark once bought. The row's existing four nodes and the rest of the tech screen are untouched.
- The owned state rides the profile's tech list like the branch's other nodes: a run started after the buy reads the lowered curve from its first reroll. The tree is only reachable between runs, so nothing changes mid-run.

## Acceptance criteria
- [ ] The tech screen's draft row shows the fifth node "A cheaper roll" at 110 coins, buyable through the row's own buy flow, wearing the owned mark after the buy.
- [ ] In a run with the node owned, the reroll button prices rerolls 25, 45, 75, 115, 165, … (first reroll 25, not 50).
- [ ] In a run without the node, the reroll prices are exactly today's 50, 70, 100, 140, 190, ….
- [ ] The lowered curve is read from the first reroll of the first run after the buy; no mid-run change.
- [ ] A resumed run with the node owned still reads the lowered curve.
- [ ] Unit tests cover the curve with and without the node, the depth-5 price of 110, and the buy/owned state.
