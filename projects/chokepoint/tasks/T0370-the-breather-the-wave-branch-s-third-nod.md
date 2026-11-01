---
id: T0370
title: "The breather: the wave branch's third node, quiet waves pay 2× the wave bonus"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T17:47:11Z
epic: E14
---

## Goal
The tech tree's "The wave" branch gets its last node — The breather: 155 coins, every quiet wave (every 4th) pays 2× the wave bonus, for every run after. With it the branch reads complete (three nodes).

## Details
- **The tech card:** "The breather", depth-3 node of the wave branch — 155 coins by the depth rule (the branch's base 30, as The door at 30 and The thin road at 85 per T0369), shown derived like every other node's price. No buy-gate inside the branch (each node buys independently at its depth price). Locked and owned looks as on the branch's other nodes, bought through the wave branch's existing buy dispatch. Card line: "Quiet waves pay 2× the wave bonus, for every run after."
- **The effect:** the wave bonus — the gold a cleared wave pays, computed at the run's own wave-bonus site (RunState's wave bonus, paid by clearWave) — is ×2 when the wave is quiet (the every-4th rule, read from core/waves.ts, read-only) and the node is owned. The owned state reaches the site the way The door's far-gate flag reaches the board generator (T0358). A cleared quiet wave pays its doubled bonus at the same moment and with the same gold pop it pays today; non-quiet waves pay their unchanged bonus.
- **What does not change:** kill gold, the quiet wave's own double kill gold (T0071), the last stand's ×4 (T0082), coins, the coin recipe and the claim card — the node doubles the wave's bonus term only.
- **On screen:** nothing new. If the coins reference's "Pays" line (T0329) lists the wave bonus, it reflects the owned node's 2× like its other owned states; if it does not, it is untouched. No HUD, no key, no sound.

## Acceptance criteria
- [ ] The tech screen's "The wave" branch shows The breather as its third node: 155 coins by the depth rule, bought with the existing dispatch, shown owned; the branch reads complete (three nodes) and every other branch is untouched.
- [ ] With the node owned, a cleared quiet wave pays exactly 2× the wave bonus it pays without the node, at the same moment with the same gold pop; a non-quiet wave pays its unchanged bonus.
- [ ] Kill gold, the quiet wave's double kill gold, the last stand's ×4, the coin payout and the claim recipe are byte-identical to before.
- [ ] A run started without the node pays the plain bonus on every wave; the game is playable menu to game over on desktop and mobile.
