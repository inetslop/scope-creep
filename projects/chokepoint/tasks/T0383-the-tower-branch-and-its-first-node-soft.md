---
id: T0383
title: The tower branch and its first node, Soft sell
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T21:57:55Z
epic: E16
---

## Goal
The tech tree gains its sixth branch, "The tower" — between-run coins buy how towers are managed — and its first node, Soft sell: a sell refunds 80% of slot cost instead of 70%, so the run's safety net (E7) is softer on every run after.

## Details
- **The row.** The tech screen gains a sixth branch row, "The tower" (the T0358 wave-branch pattern: a new branch file in the content/tech pattern, its own buy dispatch in core/tech.ts, one row in TechScene), carrying one node: **Soft sell** — 30 coins, the branch's depth-1 price under the depth rule, bought once, on for every run after.
- **The card.** The node card reads "Soft sell" with the dry one-line description "a sell pays 80% of its slots' cost, not 70%", the price line, and the owned mark when bought — the node card's own look, the branch discount/depth pricing's own behavior.
- **The effect.** While owned, the sell's refund is 80% of the tower's total slot cost instead of 70% — the sellPrice's own rounding (core/techEffects.ts), read from the owned list at the sell like every node's effect, so the panel's Sell line and the sell commit's gold pop both show the 80% number. A run without the node is byte-identical to today (70%).
- **The dot.** The menu's Tech button dot counts the new node: it shows while the profile's coins can buy at least one unowned node, Soft sell included.
- Nothing else changes: no other branch's nodes or prices, no augment, enemy, wave or board content, no other screen — the tech screen is the only new surface (one row on its existing card, the T0225 tidy-column rule keeping it fitting).

## Acceptance criteria
- [ ] The tech screen shows a sixth branch row, "The tower", with one node card: Soft sell, 30 coins, description "a sell pays 80% of its slots' cost, not 70%"; buying it spends 30 coins, wears the owned mark, and it cannot be bought again.
- [ ] In every run after the purchase, the panel's Sell line and the sell commit pay 80% of the tower's slot cost (floored, the sell's own rounding) instead of 70%; a run without the node shows exactly the old 70% numbers.
- [ ] The menu's Tech dot shows while the coins can buy Soft sell or any other unowned node, and clears when nothing is affordable.
- [ ] The tech card stays tidy and fits at 412x915 and 1280x720 with the sixth row (the layout check in the gate).
- [ ] No other branch's prices, nodes or screens change; no augment, enemy, wave or board content is touched.
