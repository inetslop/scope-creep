---
id: T0213
title: "The menu's Tech button wears a dot"
size: S
priority: 2
status: design
depends_on: [T0103]
attempts: 0
created: 2026-10-29T15:15:13Z
epic: E2
---

## Goal
A player who just earned coins should see that the tech tree can spend them: while any unowned node is in reach, the menu's Tech button wears a small dot, so the tree pulls the player in instead of waiting to be found.

## Details
- The menu's “Tech” button (under Play, T0103) shows a small yellow dot (~6 px, the HUD's own yellow, the profile card's star family, T016) in its top-right corner while the player's coins can buy at least one node the profile does not own — across all branches (run start, draft, pool, board and the claim branch when it lands).
- The dot is a pure derivation: a new helper beside `buyPoolNode` in `core/tech.ts` — `nodeInReach(purchased, coins)`: true when at least one node in any branch is unowned and its price is ≤ coins (the branch node lists are the ones the tech screen's rows read). The button draws the dot on build and re-derives it on every menu refresh (after a run's claim, after a purchase, after abandoning a resume); the dot itself is never an input target — a tap on the button opens the tree exactly as today.
- The dot clears the moment nothing is affordable: a buy that spends the last coin clears it; a run that pays out a node's price can set it. No sound, no text, no new control on the pause screen (it is a mark on an existing button, not a button).
- A first-time player (0 coins) never sees it. The profile card's coin number is untouched: the dot says “you can spend”, the card says “how much” — nothing shown twice.
- Closest existing: the “Best” star on the profile card (T016) — a small conditional mark on a menu card, derived from the profile.

## Acceptance criteria
- [ ] With coins ≥ some unowned node's price, the Tech button shows the small yellow dot in its top-right corner at 412×915 and 1280×720; with 0 coins, or with every node owned, it shows none.
- [ ] Buying a node that leaves nothing affordable clears the dot on the same screen; finishing a run that pays out an unowned node's price sets it on returning to the menu (the dot is re-derived on the menu's refresh, not cached).
- [ ] A tap on the button, with or without the dot, opens the tech screen exactly as today; no sound, and the pause screen's controls list is unchanged.
- [ ] Unit tests for the helper: 0 coins → false; 5 coins with nothing owned → true (the run-start branch's cheapest node); a balance that reaches no unowned node → false; every node owned → false at any balance.
