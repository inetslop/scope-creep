---
id: T0451
title: "The second roll: the draft branch's second node, the reroll twice per run"
size: M
priority: 2
status: designing
depends_on: [T0450]
attempts: 0
created: 2026-11-02T23:11:28Z
claimed_at: 2026-11-02T23:41:16Z
epic: E23
designer: desktop
---

## Goal
The draft branch's second node — The second roll: 85 coins, the run's once draft reroll becomes twice per run — the second costs 25 gold. A missed draft gets a second fix, paid for.

## Details
- **The tech card:** "The second roll", the depth-2 node of the draft branch — 85 coins by the depth rule, shown derived like every other node's price. No buy-gate inside the branch (each node buys independently at its depth price). The locked and owned looks as on the branch's other nodes, bought through the branch's existing buy dispatch. Card line: "the reroll is twice per run — the second one 25 gold, for every run after."
- **The effect:** with the node owned, the reroll is twice per run instead of once: after the first reroll the draft's reroll button does not go away — it returns reading "Reroll · 25". The second reroll re-rolls the offer the same way the first does — the same flip, the same tier chime, the same tier odds and no-repeat rule. The first-draft floor (a Common Bolt, T0048) keeps applying to the run's first draft however many times it is re-rolled. The second reroll pays 25 gold from the run's gold, at the same moment the first pays its 15.
- **The run remembers:** the run's reroll uses carry for the run — a saved and resumed run with the node keeps the uses it made (the button returns at 25 after one use, and is gone after two). The run save carries the count.
- **On screen:** nothing new — the existing reroll button in its existing place simply reads "Reroll · 25" after the first use while the node is owned; whatever the button does today when the run cannot afford its price, it does the same for the 25.
- **What does not change:** without the node, the reroll is byte-identical to today — once per run, 15 gold, gone after. With the node, the first reroll's price, its flip and its effect are unchanged. The draft's cards, the odds, the wildcard and the draft's other rules are untouched.

## Acceptance criteria
- [ ] The tech screen's "The draft" branch shows The second roll as its second node: 85 coins by the depth rule, bought with the existing dispatch, shown owned.
- [ ] With the node owned: the first reroll costs 15 gold as today; after it, the button returns reading "Reroll · 25"; paying 25 re-rolls the offer with the same flip, chime and rules; a third reroll never comes.
- [ ] A saved and resumed run with the node keeps its reroll uses: one used shows the 25-gold button, two used shows none.
- [ ] Without the node, the reroll is byte-identical: once per run, 15 gold, gone after.
- [ ] The game is playable menu to game over on desktop and mobile.
