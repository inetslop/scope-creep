---
id: T0110
title: "The tech tree: the draft branch"
size: M
priority: 2
status: designing
depends_on: [T0103]
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:44:11Z
epic: E2
designer: cachyos-x8664
---

## Goal
E2's second branch on the tech screen (T0103): nodes that change the draft itself — a cheaper second slot and a fourth card in the opening draft — so coins spent on the tree change what the next run can pick.

## Details
- A new row on the tech screen: the muted small label "The draft" (the "Run start" row's label style) with three node cards (the node card's look, states, purchase, chime and persistence are exactly T0103's — affordable bright, unaffordable dimmed with a red price, locked "needs the previous", owned "owned" with the yellow border; the two-note chime at 0.1):
  1. "Slot II −5" — 10 coins — "a tower's second slot costs 5 less"
  2. "Slot II −5" — 20 coins — same effect line (needs node 1; together the second slot costs 10 less)
  3. "Fourth card" — 15 coins — "the pre-wave-1 draft offers a fourth card"
- The effects apply to a new run — normal or ghost — and are read from T0103's pure tech module; a resumed run is untouched:
  - Slot II −5: each owned node reduces the price of buying a tower's second slot by 5 gold (the buy-slot price, T0088's commit path); the price never drops below 5 gold; the third slot and every later slot are unchanged.
  - Fourth card: the pre-wave-1 draft (and its reroll) offers four cards — the first three roll exactly as today (the Bolt floor, T0048, in the first slot; the no-repeat rule, T0052), and the fourth rolls like T0065's fourth (same tier odds, same no-repeat rule, flips in last with its own tier chime, T0065's fit: one row at 1280x720, 2×2 at 412x915). Drafts from wave 2 on are never four unless T0065's every-5th rule says so.

## Acceptance criteria
- [ ] The tech screen shows the "The draft" row with the three nodes, buying like T0103's nodes (states, pop, chime, persistence across a reload).
- [ ] With one Slot II node owned, a new run's second-slot price is 5 less than today's at every tower; with two, 10 less (never below 5 gold); with none, byte-identical to today; later slots are unchanged.
- [ ] With the Fourth card node owned, the pre-wave-1 draft and its reroll offer four cards, the fourth flipping in last with its own tier chime and T0065's fit; without it the pre-wave-1 draft is byte-identical to today; drafts from wave 2 on are untouched.
- [ ] The effects apply to a new run and a ghost run, never to a resumed one.
