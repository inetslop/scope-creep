---
id: T0369
title: "The thin road: the wave branch's second node, every enemy 10% slower"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T17:47:11Z
claimed_at: 2026-11-01T17:47:15Z
epic: E14
designer: desktop
---

## Goal
The tech tree's "The wave" branch (T0358) gets its second node — The thin road: 85 coins, every enemy walks 10% slower, in every wave, for every run after the purchase. The branch's pace node, alongside The door's gate node and The breather's payout node (T0370).

## Details
- **The tech card:** "The thin road", depth-2 node of the wave branch — 85 coins by the depth rule (the branch's base 30, The door at depth 1 per T0358), shown derived like every other node's price. No buy-gate inside the branch: each node buys independently at its depth price (the depth price alone orders the branch). Locked and owned looks as on the branch's other node, bought through the wave branch's existing buy dispatch. Card line: "Every enemy walks 10% slower, for every run after."
- **The effect:** one 0.9 walk-speed factor on the run, read from the owned tech at run start (the The-door pattern, T0358) and applied at the run's spawn-speed-factor site (where the Swift level augment's 15% factor applies, T0294), so every enemy inherits it wherever its speed is read: a Dot walks 1.44 cells/s (not 1.6), a Block 0.81 (not 0.9), the Sprinter's ramped speed carries the factor, split children (Splinter, Shard) spawn with it, and the far gate's share (T0338) is no exception. A Dasher's crawl is 10% slower and its dash takes 10% longer for the same 3 cells. The run's boss is no exception (a Colossus walks 0.81; the Hive's pops inherit). E10's flyer, once it is on the board (T0353), crosses 10% slower through the same factor.
- **What does not change:** hp, threat, spawn timing, wave budget, the Dasher's dash distance, wave structure: the wave takes ~10% longer, and that is the whole node.
- **No HUD, no key, no sound, no new readout:** the tech screen shows the node owned and the road reads slower where the player looks — the effect is visible in the enemies' own pace, nothing shown twice, nothing painted on the board.

## Acceptance criteria
- [ ] The tech screen's "The wave" branch shows The thin road as its second node: 85 coins by the depth rule, bought with the existing dispatch, shown owned; every other branch untouched.
- [ ] With the node owned, every enemy in every wave walks at 0.9× its normal speed — a Dot 1.44 cells/s, a Block 0.81, a Dasher's crawl slower with a longer dash, split children and the far gate's share included, bosses included — with hp, threat, spawn timing and wave budget unchanged.
- [ ] A run started without the node is byte-identical to before this task (no factor applied anywhere); a resumed run keeps the factor it started with.
- [ ] The game is playable menu to game over with the node owned and unbought, on desktop and mobile.
