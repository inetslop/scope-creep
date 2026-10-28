---
id: T0074
title: "Chain leaps once, plus one per extra Chain"
size: S
priority: 1
status: design
depends_on: [T0025]
attempts: 0
created: 2026-10-28T21:08:30Z
---

## Goal
Chain (T0025) lands with 3 leaps per attack: against a group that is 45 damage or more every 1.2 s, about twice what Lance or Bolt deal. Start it at one leap and let every extra Chain in the tower add one, the same way Lance's pierce grows: one Chain hits 2 enemies, two Chains 3.

## Details
- **As a tower's first augment:** the zap strikes the enemy furthest along in range, then leaps **once** (2 enemies in all). Every further Chain in the same tower (any slot, any tier) adds 1 leap: a Chain tower with one more Chain added leaps twice (3 enemies).
- **Added to another tower:** unchanged: each attack leaps to 1 more enemy per Chain added.
- Damage per leap (15 / 18 / 20), cadence (every 1.2 s / 1.05 s / 0.9 s), range (2.8 cells) and leap reach (2.5 cells) stay as T0025 built them.
- **Card line (Common):** first: "A zap that leaps: 15 damage, 1 leap, every 1.2s." Rare and Epic show their own damage and cadence the same way; the added line is unchanged.
- **Tower panel line:** says how many enemies the zap reaches.

## Acceptance criteria
- [ ] A lone Chain tower's zap strikes 2 enemies per attack (when 2 are in reach); with a second Chain in the tower, 3.
- [ ] A Bolt with one Chain added still leaps to 1 more enemy, with two Chains added to 2 more.
- [ ] The card lines and the tower panel show the new counts at every tier.
- [ ] Chain's unit tests are updated to the new counts.
