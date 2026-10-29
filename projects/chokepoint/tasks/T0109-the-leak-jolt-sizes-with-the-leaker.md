---
id: T0109
title: The leak jolt sizes with the leaker
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:51:27Z
designer: desktop
---

## Goal
Pillar 5, priced by the cost: the board's jolt when an enemy leaks scales with the leaker's size, so a Hauler slipping through — the one that also costs 5 gold (T0057) — is felt where it is seen.

## Details
- The existing leak jolt (the board shake when an enemy reaches the exit) scales its amplitude by the leaker's token size factor: amplitude × (1 + (size − 1) × 1.5). A size-1.0 shape (Dot, Dart, Block, Mute, Splinter, Sprinter at its base size, Splitter's children) stays byte-identical to today (1.0×); a Hauler (1.3) lands at 1.45×; the Bulwark (1.25, T0102) at 1.375×.
- The jolt's shape (the quick offset that eases back) and its trigger (the leak moment) are unchanged; only the amplitude scales with the leaker's size.
- Pure juice: no sound, no HUD, no rule change, no pause-screen line.

## Acceptance criteria
- [ ] A size-1.0 enemy (e.g. a Dot) leaking jolts the board exactly as it does today.
- [ ] A Hauler leaking jolts visibly harder (~1.45× the amplitude) with the same shape and timing.
- [ ] No enemy ever jolts less than today; the leak warning, the lives number and any leak sound are untouched.
