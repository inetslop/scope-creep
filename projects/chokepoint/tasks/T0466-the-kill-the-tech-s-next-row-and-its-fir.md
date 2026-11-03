---
id: T0466
title: "The kill: the tech's next row and its first node, The bounty"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T02:48:20Z
claimed_at: 2026-11-03T03:26:16Z
epic: E25
designer: desktop
---

## Goal
The tech tree has covered run start, board, pool, claim, wave, tower, exit and the draft — but not the kill itself: a "The kill" row on the tech screen lets between-run coins buy how a kill pays, starting with its first node, The bounty, which makes every kill pay +1 more gold.

## Details
- The branch: the tech screen's next row, "The kill", placed after The exit's row in the exit branch's row pattern (T0423, the closest example): one node for now, bought once and on for every run after, the owned mark on the bought node, the branch discount rule (T0214) already applying to its later nodes.
- The bounty (30 coins, the branch's first node; the card reads "The bounty — every kill pays +1 gold"): every kill pays +1 gold. The +1 rides on the bounty before the multipliers, so the quiet wave's ×2 (T0071) and the last stand's ×2 (T0054) double it too: a Dot (4 gold) pays 5, 10 on a quiet wave, 20 in the last stand on a quiet wave. The gold pop reads the summed number in the last stand's own look (T0054); no new HUD.
- What the node does not touch: the Mint's +1 aura (still paid whole on top), the combo gold (T0066's +2/+4 pop), the Hauler's leak cost, the wave's clear bonus, and the run's coin tally.
- Parked behind this row (tasked once it lands): The window (85 coins, the kill-chain window +0.5 s) and The milestone (155 coins, the chain's milestone pay ×2).

## Acceptance criteria
- [ ] The tech screen shows the new row "The kill" with one node, "The bounty · 30", in the branch row's own look; it buys for 30 coins, wears the owned mark, and the buy is remembered on the profile.
- [ ] With The bounty bought, kills in the next run pay +1 gold each: a Dot's kill pops 5 (4 without the node), a Hauler's 11; the number in the pop is the gold actually paid.
- [ ] The +1 is doubled by the quiet ×2 and the last stand ×2 (a Dot pops 10 on a quiet wave, 20 in the last stand on a quiet wave).
- [ ] Without the node, every kill pays exactly what it paid before — no run-state change for an unbought profile.
- [ ] The coin tally, the claim card and the Hauler's leak cost are unchanged by the node.
