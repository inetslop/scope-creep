---
id: T0085
title: Unit tests for the Arc chain
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T06:43:50Z
claimed_at: 2026-10-27T06:58:27Z
designer: yoga
---

## Goal
`src/core/arc.ts` is the last pure core module without unit tests; lock the Arc weapon's chain rules (T0022) so a future change to the chain is caught by the gate, not a playtest.

## Details
- New file `tests/core/arc.test.ts`, pure-function style copied from `tests/core/crop.test.ts` (no Phaser, deterministic inputs, no timers).
- Lock the chain as implemented in `src/core/arc.ts`: the bolt hits the first enemy within 260 units of the aim point; each hop then jumps to the nearest un-hit enemy within the chain radius; damage falls off per hop; the chain ends when a hop finds no target in range. The architect pins the exact chain radius, per-hop falloff and hop cap from the source in the Design — the assertions describe the code as it stands today, so the test is a regression lock, not a redesign.
- Cover at least four cases: an aim with no enemy within 260 units produces no chain; two enemies in a line within the chain radius are both hit, in order; a third enemy beyond the chain radius is not hit; an already-hit enemy is not hit twice by one bolt.

## Acceptance criteria
- [ ] `tests/core/arc.test.ts` exists and passes in the automated gate.
- [ ] The tests assert real numbers (chain radius, per-hop damage), so they fail if the chain rules change.
- [ ] No file under `src/` is modified.
