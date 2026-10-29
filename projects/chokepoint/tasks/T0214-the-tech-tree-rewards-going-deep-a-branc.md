---
id: T0214
title: "The tech tree rewards going deep: a branch discount"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T15:52:06Z
epic: E2
---

## Goal
A player who completes a branch pays less for its later nodes, so going deep in one branch is worth it over spreading thin across branches.

## Details
- In the tech tree, a node's price drops as more of its own branch is already owned: the first node of a branch is full price, the second costs 5 coins less, and the third and any later node cost 10 coins less. The discount never takes a node below 5 coins. The discount is derived purely from how many nodes of that branch are owned — there is nothing extra to buy, and it resets to nothing the moment a branch has no owned nodes.
- The node card shows it exactly where the price already sits: the full price in muted gray with a thin strike line through it, and the discounted price in the normal ink right beside it. A first node (no discount) shows only its normal price — no strike line.
- Buying pays the discounted price and owns the node exactly as it does today; the owned mark is unchanged.
- The rule applies to every branch automatically (run start, the draft, the pool, the board, the claim) — no per-branch content change.
- Bright minimal: the strike line is a thin muted-gray stroke over the old price, no color, no theme dressing.

## Acceptance criteria
- [ ] The first node bought in a branch pays its full listed price, and its card shows only that price (no strike line).
- [ ] Once exactly one node of a branch is owned, the next unowned node's card shows the full price struck through and a price 5 coins lower; buying it pays the lower price.
- [ ] Once two or more nodes of a branch are owned, the next node's card shows the full price struck through and a price 10 coins lower (never below 5); buying it pays that.
- [ ] The discount is per branch: owning any number of nodes in one branch never changes the price of a node in a different branch.
- [ ] An owned node keeps its owned mark and shows no price at all (no strike line).
- [ ] No other screen changes: the menu, the profile card, the pause card and the claim card are untouched; the discount appears only on tech-tree node cards.
