---
id: T0357
title: "The wave branch: the tech tree's fifth branch, and The door node"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T12:09:03Z
epic: E14
---

## Goal
The tech tree grows a fifth branch, "The wave", whose nodes change what a wave does in every future run. The first node, The door, puts the far gate (T0338) on every board, so between-run coins buy how a run plays, not just what it pays or where the road bends.

## Details
- The tech screen gains a fifth branch, "The wave", in the rows and card language of the other branches, with one node card: "The door", list price 30 coins (the branch's first node; the branch discount's struck-through price, T0214, shows only once a second node exists).
- Buying works like every other node: 30 profile coins, dimmed with a red price while unaffordable, the owned mark once bought; the menu's Tech-button dot (T0213) counts it as affordable.
- While The door is owned, every board grown after the buy — a new run, the menu's live demo — has the far gate, exactly as today's far-gate boards do (T0338): a second entrance partway down the road, and a third of each non-boss wave's enemies coming in through it. The current "some boards" gate roll is bypassed only while the node is owned; without the node, board generation is unchanged.
- The gate stays a per-board fact: a board grown before the buy keeps its own fact, so a run mid-play, a resumed run and a ghost run never change the gate mid-run.
- The pause screen's boards reference (T0350) reads the node's source from the tech's own data, the way its tech-sourced rows do: the far gate's row names the node (owned) while The door is bought, and "some boards" while it is not.
- The wave's mix, hp and intervals are unchanged, the far gate's own rules (the third-of-the-wave split) are unchanged, and what a run pays (the coin formula, the live tally, the claim card) is unchanged: the node changes the board, not what a wave sends or what a run pays.
- The fork (T0352) is a separate board fact that lands independently; a board may carry both the far gate and the fork — no exclusivity.

## Acceptance criteria
- [ ] The tech screen shows a fifth branch, "The wave", with one card, "The door", list price 30 coins, in the same rows and card look as the other branches; the menu's Tech dot turns on while 30 coins sit on the profile.
- [ ] Buying The door spends 30 coins and the card wears the owned mark; dimmed with a red price while unaffordable.
- [ ] After the buy, a new run's board has the far gate, shown where today's far-gate boards show it (the board, the board preview and the next-wave preview), and a third of each non-boss wave's enemies come in through it; without the node, the "some boards" gate roll is exactly as today.
- [ ] The pause screen's boards reference shows the far gate's source as the node (owned) while The door is bought, and "some boards" while it is not.
- [ ] A resumed run and a ghost run keep the board's own gate; the coin formula, the live coin tally and the claim card are unchanged by the node.
