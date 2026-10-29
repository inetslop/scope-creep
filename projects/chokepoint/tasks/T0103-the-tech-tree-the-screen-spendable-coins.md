---
id: T0103
title: "The tech tree: the screen, spendable coins, and the run-start branch"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:23:55Z
epic: E2
designer: desktop
---

## Goal
The foundation of E2 (the tech tree): a "Tech" button on the menu opens a white-card screen where the coins runs earn (E1) become spendable, and the first branch buys lasting run-start bonuses — the first reason to play one more run.

## Details
- Menu: a white "Tech" button under Play (the Resume button's shape, T0042) with one muted line "spend your coins". It is tappable even at 0 coins (the empty tree is readable). It is a menu button, shown where it is used; no new key, so nothing to list on the pause screen.
- Screen: the menu dimmed behind (the rewards card's pattern, T0003), one white card: title "Tech" (the menu card's title style), a coin-balance line under the title (the coin icon and bold number, the profile card's look, T0007), then one branch row: the muted small label "Run start" and four node cards. A "Menu" button at the bottom of the card (the rewards card's button) returns to the menu; tapping the dimmed background does nothing.
- Node cards, each a small white card: a bold name (16 px), one muted effect line, and a price line (number + coin glyph, the reroll button's language, T0036):
  1. "Gold +5" — 5 coins — "new runs start with 5 more gold"
  2. "Gold +5" — 10 coins — same effect line (needs node 1)
  3. "Gold +5" — 15 coins — same effect line (needs node 2)
  4. "Life +1" — 30 coins — "new runs start with one more life"
- Node states: affordable = full bright; unaffordable = dimmed with the price in red (the reroll look, T0036); locked (the previous node in the row not owned) = dimmed with a muted "needs the previous" line; owned = the price line replaced by a muted "owned" and the card wearing a thin yellow (the coin's color) border.
- Buying: one tap on an affordable node — the balance drops (the number pops, T0017's pop class), a two-note chime plays (the coin chime's shape, T0009: E5 then G5, 80 ms each, at the tier chime's quiet volume, T0032: 0.1 — quieter than a payout; silent with sound off, T0035), and the card turns owned. Buying never takes the balance below 0.
- The effect: a new run — a normal run or a ghost run — starts with its usual starting gold plus 5 per owned gold node, and its usual starting lives plus 1 per owned life node; a resumed run is untouched. The bonuses are read from a new pure module (the profile's purchased-node list → start bonuses) with unit tests; with no nodes owned the starting values are byte-identical to today.
- Profile: a new saved field for purchased nodes (a list of node ids, saved with the profile and parsed defensively, the T0001 pattern). The profile's coin field becomes the spendable balance: a run's payout adds to it exactly as today, a node purchase subtracts from it; the menu's profile card coin line (T0007) shows this balance — no new element.
- The screen shows only this branch for now; the other two branches (the draft, the pool) land as their own tasks, one row at a time (the claim card's growth pattern, T0075 → T0081).
- Layout: 1280x720 — the four node cards in one row; 412x915 — a 2×2 grid; no text below 12 px; the card fits both without scrolling.

## Acceptance criteria
- [ ] The menu shows a "Tech" button under Play with the muted "spend your coins" line; pressing it opens the tech card over the dimmed menu, and the "Menu" button returns.
- [ ] The balance line shows the profile's coins; after a run pays out the number has grown, and after buying a node it has dropped by exactly the node's price (the menu's profile card shows the same balance).
- [ ] A node dimmed with a red price cannot be bought; an affordable node buys with one tap: the balance drops, the pop and the two-note chime play, the card shows "owned" with the yellow border.
- [ ] Gold node 2/3 and the life node are locked (dimmed, "needs the previous") until the previous node in the row is owned.
- [ ] With all four nodes owned, a new run starts with +15 gold and +1 life over today's starting values; with none owned, starting values are byte-identical to today; a ghost run gets the bonuses, a resumed run does not.
- [ ] Purchases persist across a page reload: owned nodes stay owned and the balance stays reduced.
- [ ] No new hotkey; nothing new on the pause screen.
