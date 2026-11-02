---
id: T0432
title: "The deep scorch: the cell at 24+ kills burns deeper"
size: M
priority: 2
status: designing
depends_on: [T0414]
attempts: 0
created: 2026-11-02T16:14:55Z
claimed_at: 2026-11-02T16:43:51Z
epic: E19
designer: inet-racing
---

## Goal
The run's hottest cell earns the run's strongest cell buff: a scorch cell that has seen enough kills burns deeper, and a tower built there deals more — the fight's hot spot becomes the placement that pays most.

## Details
- Builds on the scorch cell (T0414): a build cell where 24+ enemies died this run (up from 12) burns deeper — a thin second ring around the chip's own ring (the scorch chip's own muted ink, ~40% alpha), on the same cell for the rest of the run. A 12-23 kill cell keeps the plain chip.
- A tower built on a deep scorch cell deals +10% damage instead of +5%, for its whole life on the cell (the scorch's own build-time rule; a move (E15) onto a deep cell takes the +10% live, the marked cell's own rule, T0387).
- Wherever T0414 reads the scorch's buff (its own read of the +5%), the deep cell reads 10 — the live value on the existing read, nothing new on screen.
- The run's first deep scorch says what it means once: the moment a cell first crosses 24 kills, a muted chip at the cell reads "deep scorch · +10% damage" (T0414's first-scorch teach's own look, spot and ~1.5 s timing), once per run.
- The deep state is derived from the per-cell kill count T0414 saves — nothing new in the run save format.
- What the player sees differently and why it makes placing more interesting (the board bar): the second ring separates the run's hottest cell from its warm ones, so the placement that pays +10% instead of +5% is readable at a glance — the mark doubles the stakes of a placement, it is not a hint.

## Acceptance criteria
- [ ] A cell at 24+ kills this run wears the chip's thin second ring for the rest of the run; a 12-23 kill cell keeps the plain chip.
- [ ] A tower built on a 24+ kill cell deals +10% damage (a 12-23 cell +5%); the buff's existing read shows 10 on a deep cell.
- [ ] The run's first cell to cross 24 kills shows the one-time muted chip; no second one, and none on a resumed run after it was shown.
- [ ] A resumed run derives the deep state from the saved kill count; the save format gains nothing beyond T0414's.
- [ ] A run in which no cell reaches 24 kills is byte-identical to T0414's state (no ring, no chip, no +10%).
