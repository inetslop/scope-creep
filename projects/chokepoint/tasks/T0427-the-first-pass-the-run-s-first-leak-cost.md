---
id: T0427
title: "The first pass: the run's first leak costs no life"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T14:32:01Z
epic: E20
---

## Goal
The exit branch's third node: a run with it never pays a life for its first leak — the run's first stumble is free, the second one is not.

## Details
- The tech screen's "The exit" branch (T0423) gains its third node, "The first pass": 155 coins (the depth-3 price on the branch's re-priced curve, Held pays' line), bought once, on for every run after.
- While owned, the run's first leak (any enemy) costs no life: a Block's 2-life leak costs 0, not 1. The leak still breaks the kill combo (T0207), still plays the leak jolt, and a Hauler's leak still pays its 5 gold — the node waives the life, never the Hauler's own rule. The second leak on is normal: a Block costs its 2 lives (1 once One life a Block, the branch's second node, lands).
- A per-run flag on the run state, carried by the run save: a resume taken after the first leak keeps it spent, a fresh run starts unspent.
- The first-leak chip (T0107's "leaks cost a life" at the exit) reads "first leak free" while the node is owned — the same one-time chip, its line changes with the rule; the second leak shows nothing new.
- The exit warning, the last stand and the wave card's "held · N" chip are unchanged (a 0-life leak is not a held wave, and a first-pass leak pays no Held-pays coins — the formula handles it, no special case).

## Acceptance criteria
- [ ] The exit branch's third row reads "The first pass" at 155 coins and buys in the T0423 pattern; owning it changes no other branch.
- [ ] A run with it: the first leak of any enemy costs no life; the exit chip reads "first leak free" once; the combo still breaks; a Hauler's first leak still costs 5 gold.
- [ ] The second leak costs normal lives (a Block's 2).
- [ ] A resume taken after the first leak keeps the flag spent; a fresh run starts unspent.
- [ ] Without the node, a run is byte-identical to today.
- [ ] Unit tests for the node's price and purchase and for the flag through the run save; `npm run check` and the desktop + mobile smoke pass.
