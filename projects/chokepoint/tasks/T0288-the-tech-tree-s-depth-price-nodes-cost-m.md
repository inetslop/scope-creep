---
id: T0288
title: "The tech tree's depth price: nodes cost more the deeper they are"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T16:07:56Z
epic: E9
---

## Goal
The tree gets a bigger sink to match the coming level-augment coin boost: a node's price is derived from its depth in its branch (superlinear, not exponential), and the branch discount goes.

## Details
- A new pure function in src/core/tech.ts: `nodePrice(base, depth)` = `base × depth^1.5` rounded to the nearest multiple of 5 (halves round up). depth is the node's 1-based position in its branch (the branch's first node is depth 1).
- Each branch's base is its first node's current stored price. A depth-k node's displayed and purchase price becomes `nodePrice(branchBase, k)`, and the stored prices of depth-2-and-deeper nodes are no longer read. Resulting shapes: the pool branch (base 25) reads 25, 70, 130; the board branch (base 30) reads 30, 85; the claim branch (base 30) reads 30; the run-start branch's five nodes read round5(base × k^1.5) for k = 1..5 (with its base of 10 that is 10, 30, 50, 80, 110).
- The branch discount (5/10 off the 2nd/3rd node, T0214) is removed wherever it is computed or shown, and the card's struck-through old-price line goes with it (one in, one out: the price line keeps its slot and shows one number).
- No new nodes in this task (deeper nodes priced on this curve come in a later slice). Owned nodes stay owned exactly as saved; a buy spends the derived price; the Tech button's affordability dot (T0213) recomputes from the derived prices; the coin formula, the pause worth line and the claim recipe are untouched.
- Card text still fits at 412x915 and 1280x720 with the longest derived price (a 3-digit number like 130).

## Acceptance criteria
- [ ] `nodePrice` has unit tests: (10,1..5) → 10, 30, 50, 80, 110; (25,2) → 70; (25,3) → 130; (30,2) → 85; rounding to the nearest multiple of 5.
- [ ] In the Tech scene every unowned node's price line shows the derived price with no struck-through old price; each branch's first node shows exactly the same number as before this task.
- [ ] Buying a 2nd/3rd node spends the derived price (pool branch: 70/130, not 25/20); a profile that already owns a node loads with it owned, at no cost.
- [ ] The menu's Tech button dot appears exactly when any unowned node is affordable at its derived price.
- [ ] The gate passes (typecheck, lint, unit tests, browser smoke test).
