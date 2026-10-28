---
id: T010
title: Tier pips on the tower
assignee: yoga
size: S
priority: 3
status: design
depends_on: [T0002]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E4
---

## Goal
You can tell a tower's tier at a glance from the board: each augment slot shows a small pip in its tier color.

## Details
- Every augment slot on a tower shows a small rounded pip (a circle, about 25% of the tower base's width) on the front edge of the tower base, in slot order (first slot left, next slots to the right):
  - Common: light gray
  - Rare: blue
  - Epic: purple
- The pips sit below the existing augment display (barrel/ring/ticks) so they never cover it (closest example: the existing per-augment tower markings).
- When a new augment is added to a tower, its pip appears with the same pop-in the existing augment display uses.

## Acceptance criteria
- [ ] A 1-slot tower shows 1 pip; a 3-slot tower shows 3 pips in slot order.
- [ ] Pips are light gray (Common), blue (Rare), purple (Epic) to match the card frames.
- [ ] Pips are visible at 1x zoom on 412x915 (not smaller than ~6px on screen) and do not cover the barrel or the road.
- [ ] Adding an augment to a tower makes its pip appear with the pop-in.
