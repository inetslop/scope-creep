---
id: T0017
title: The HUD coin tally pops as it grows
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-28T03:39:38Z
epic: E1
---

## Goal
The run's coin tally (the "+N coins" line in the HUD, added by T0013) should feel alive: when N goes up, the number gives a quick, quiet pop.

## Details
- The StatsCard already shows "+N coins" and N grows during a run (T0013). When N increases by at least 1, the "+N" number does a quick scale pop: scale to about 1.15 and back over ~150 ms, once per increase.
- The small coin icon (the same 12 px coin the line already uses) flashes a touch brighter for the same ~150 ms.
- No sound here (the payout chime is T0009's job on the rewards screen); this is a quiet visual pop during the run.
- If N jumps by several coins at once (a wave bonus), it pops once, not once per coin.
- The card's size and layout are unchanged; the pop is a scale on the existing text and icon, so it inherits the card's layout.
- It must work at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Killing an enemy (a coin gain) makes the "+N" number do one quick scale pop (~150 ms).
- [ ] A wave bonus (a bigger jump in N) pops once, not several times.
- [ ] The pop is quiet (no sound) and the card's size and layout are unchanged.
- [ ] A fresh run at "+0 coins" does not pop.
