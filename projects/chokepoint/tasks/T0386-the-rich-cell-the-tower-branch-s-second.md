---
id: T0386
title: "The rich cell: the tower branch's second node, the marked cell 1.25× to 1.5×"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T22:53:02Z
epic: E16
---

## Goal
The tech tree's "The tower" branch (T0383) gains its second node — The rich cell: 85 coins, the board's marked cell makes its tower carry a 1.5× buff instead of 1.25×, in every run after the purchase. The branch's value node, built ahead of The light move (the branch's third node, 155 coins, once the move exists).

## Details
- **The card.** A second node on the "The tower" branch — The rich cell, 85 coins by the depth rule (the branch's depth-2 price, derived exactly like the thin road's 85, T0369), shown derived like every other node's price (the struck-through old price included). Bought once, on for every run after. No buy-gate inside the branch: each node buys independently at its depth price (the Soft-sell pattern, T0383) — it can be bought whether or not Soft sell is owned. Card line: "the marked cell makes its tower 1.5× stronger, not 1.25×." It sits directly after Soft sell; the branch's third slot is left for The light move.
- **The effect.** While owned, the board's marked cell (T0340) carries a 1.5× buff instead of its 1.25× — the cell's own buff value, read from the owned tech at the site where the 1.25× is already applied (a `markedCellMul(owned)` reader in the sellRefund pattern, T0383), so wherever the marked cell's buff is already shown it reads 1.5× when owned. A run without the node is byte-identical to today (1.25×).
- **Why it matters in play.** The marked cell's position, look and which boards carry it are unchanged; only its buff rises, so a tower placed on the cell is worth 33% more than before — the one guaranteed strong cell on the board becomes a stronger call, and the board's placement decision (Pillar 1) sharpens around it.
- **The dot.** The menu's Tech button dot counts the new node: it shows while the profile's coins can buy at least one unowned node, The rich cell included (the Soft-sell dot's own behavior, T0383).
- **On screen / layout.** Nothing new stays on screen: the tech screen shows the node owned, and the marked cell's buff reads 1.5× where it is already shown — nothing shown twice, nothing painted on the board. The "The tower" row now holds two cards and still fits at 412x915 and 1280x720 (the wave branch's three-card row is the existing example of the row's wrapping layout).

## Acceptance criteria
- [ ] The tech screen's "The tower" branch shows a second node, The rich cell: 85 coins by the depth rule, card line "the marked cell makes its tower 1.5× stronger, not 1.25×", bought with the branch's existing dispatch, shown owned, not buyable again, and buyable whether or not Soft sell is owned.
- [ ] With the node owned, the marked cell's buff is 1.5× (its buff site reads 1.5 from the owned tech, shown wherever the buff is already shown); a run without the node is exactly 1.25× and byte-identical to before this task.
- [ ] The menu's Tech dot shows while the coins can buy The rich cell or any other unowned node, and clears when nothing is affordable.
- [ ] The marked cell's position, look and which boards carry it are untouched; no other branch's nodes or prices, augment, enemy, wave or board rule changes.
- [ ] The tech card fits at 412x915 and 1280x720 with the tower row holding two cards (the layout check in the gate).
- [ ] The game is playable menu to game over with the node owned and unbought, on desktop and mobile.
