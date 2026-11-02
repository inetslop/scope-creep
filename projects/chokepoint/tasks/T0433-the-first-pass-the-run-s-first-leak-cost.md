---
id: T0433
title: "The first pass: the run's first leak costs no life"
size: M
priority: 2
status: design
depends_on: [T0429]
attempts: 0
created: 2026-11-02T16:14:55Z
epic: E20
---

## Goal
The exit branch's third node: one free leak per run, bought once with between-run coins — the first time the road breaks through is a warning, not a cost.

## Details
- The tech screen's exit branch (T0423's row) gains a third node, "The first pass": 155 coins by the depth rule (the branch's own price curve, depth 3), bought independently like the branch's other nodes (no buy gate inside the branch, the T0370 rule), the branch's own card and owned-mark pattern.
- With the node owned, the run's first leak — whatever the leaker — costs no life: the enemy leaves through the exit, the leak's own feedback plays (the thud, the jolt, the echo, the combo break, a standing Toll's gold and the Hauler's +5 gold still pay), and the lives number does not move. The second and later leaks pay in full (a Block's halved cost from T0429 applies from the second leak on, with the node owned). A boss leak that ends the run still ends it — the pass waives the life cost only.
- A wave that leaks through the free pass is not clean (a leak happened): it wears no held chip (it cost 0 lives, nothing to show) and breaks the clean streak as any leak does (T0045's rule); the run's story mark is the held gray, not the clean green.
- Teach: with the node owned, the run's first-leak chip (T0107's own moment, look and spot at the exit) reads "first leak free · after that, leaks cost a life" instead of T0107's line — once per run, the once-flag riding the same per-run state as the pass. Without the node, T0107's chip is byte-identical.
- The pass is per run: a per-run flag (spent or not) the run save carries (the T042 run-save pattern), so a resumed run keeps whether the pass was spent; the node itself is the usual permanent profile purchase.

## Acceptance criteria
- [ ] The exit branch lists three nodes; the third reads "The first pass" at the depth-3 price, buys independently and wears the owned mark like the branch's others.
- [ ] With it owned, the run's first leak costs no life and shows the one-time free-pass chip at the exit; the second leak pays in full (a Block pays 1 life with T0429 owned, 2 without).
- [ ] The Hauler's +5 gold and a standing Toll's gold still pay on the free pass; a boss leak that ends the run still ends it.
- [ ] A free-pass wave is not clean: no held chip, the clean streak breaks, the story mark is the held gray.
- [ ] A resumed run keeps the pass state: one that spent it before closing pays its next leak in full with no chip; one that did not keeps the pass.
- [ ] Without the node, every leak is byte-identical to today, including T0107's chip.
