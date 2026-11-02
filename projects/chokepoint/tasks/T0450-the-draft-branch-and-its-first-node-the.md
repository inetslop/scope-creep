---
id: T0450
title: "The draft branch and its first node, The early odds: the rare odds start at wave 1"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-11-02T23:11:28Z
claimed_at: 2026-11-02T23:32:19Z
finished_at: 2026-11-02T23:41:53Z
epic: E23
design_attempts: 1
---

## Goal
The tech tree gains an eighth branch — The draft — with its first node, The early odds: 30 coins, the draft's tier-odds shift (T0011) starts at wave 1 instead of wave 5, for every run after. The run's opening drafts roll the richer odds, so the first pick of the run is no longer Common-heavy.

## Details
- **The branch:** "The draft" joins the tech screen as its own row, the wave branch's pattern (T0358): the branch's own card in the row list, its own node column, no buy-gate inside the branch (each node buys independently at its depth price), the locked and owned looks as on the other branches, bought through the tech screen's existing branch dispatch.
- **The tech card:** "The early odds", the depth-1 node of the draft branch — 30 coins by the depth rule, shown derived like every other node's price. Card line: "the draft's rare odds start at wave 1, not wave 5, for every run after."
- **The effect:** the tier-odds shift (T0011) — the draft's odds that start growing at wave 5 — starts growing at wave 1 instead, the same growth and the same caps, four waves earlier. The shift's first step lands on wave 1: a wave-N draft with the node rolls exactly the odds a wave-(N+4) draft rolls without it, on every N. The owned state reaches the odds site the way The door's far-gate flag reaches the board generator (T0358) — a pure reader over the run's owned nodes.
- **On screen:** nothing new — the draft's odds line, which already shows the run's live odds, reads the shifted odds while the node is owned. No HUD, no key, no sound.
- **What does not change:** the first-draft floor (a Common Bolt, T0048), the no-repeat rule, the four-card draft and its wildcard, the reroll and its 15 gold, the card frames and gem rows, the tier chime. A run without the node rolls the exact odds of today on every draft.

## Acceptance criteria
- [ ] The tech screen shows "The draft" as its own branch row with The early odds as its first node: 30 coins by the depth rule, bought with the existing dispatch, shown owned; every other branch is untouched.
- [ ] With the node owned, a wave-N draft rolls exactly the odds a wave-(N+4) draft rolls without the node, on every N.
- [ ] The draft's odds line reads the shifted odds while the node is owned.
- [ ] A run without the node rolls byte-identical odds on every draft; the first-draft floor, the no-repeat rule, the four-card draft, the wildcard and the reroll are untouched.
- [ ] The game is playable menu to game over on desktop and mobile.

## Rejected by architect (cachyos-x8664)

"The draft" already exists as the tech screen's 2nd branch — `content/tech/draft.ts` `DRAFT_NODES` (the Slot II / fourth-card nodes, bought through `buyNode` at a 10-coin depth-1 price, `nodeCost` base = `branch[0].price` = 10), so the task's new "The draft" branch with a 30-coin depth-1 node bought through the wave-style independent dispatch collides with the existing branch it must leave "untouched"; a 30-coin depth-1 node can't sit in DRAFT_NODES (whose depth-1 price is 10) without a price that "violates the depth rule", and making the branch a separate array would be a second "The draft" row.
