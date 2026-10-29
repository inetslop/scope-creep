---
id: T0215
title: "The run-start branch reads complete: a fifth node and a done mark"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T15:52:06Z
epic: E2
---

## Goal
The run-start branch has a last node to reach, and a branch that is fully owned is visibly done.

## Details
- Add a fifth node to the run-start branch: a second “Life +1” at 40 coins. It uses the same life effect the branch's existing life node already uses, so the two life nodes stack — buying both starts a run with two more lives than a run with neither.
- A branch that has every one of its nodes owned wears a small complete mark: one small filled yellow dot (the tree's own accent) at the right edge of the branch title line. A branch with any unowned node shows no mark. The dot appears the moment the last node is bought and, because nodes cannot be un-bought, never clears.
- The new node's card looks exactly like the branch's other nodes: the name “Life +1”, its price, and the owned mark once bought. If the branch discount (T0214) has landed, this node shows the discounted price like its siblings; if it has not, the node shows 40. This task does not depend on T0214 — it lands correctly either way.
- The done mark works for any branch: the claim branch, which has a single node, wears the dot the moment that node is owned.

## Acceptance criteria
- [ ] The run-start branch now has five nodes; the fifth is a second “Life +1” priced at 40 coins.
- [ ] Buying both life nodes starts a new run with exactly two more lives than a run with neither (the effects stack).
- [ ] The moment the last unowned node of the run-start branch is bought, one small yellow dot appears at the right edge of that branch's title; the dot is absent from any branch that still has an unowned node.
- [ ] A single-node branch that is fully owned (the claim branch, once its one node is bought) also wears the dot.
- [ ] Buying the fifth node deducts 40 coins (or the discounted price, if T0214 has landed) from the profile and owns the node exactly like the branch's other nodes.
- [ ] No other branch, node or screen changes; the done dot is the only new readout.
