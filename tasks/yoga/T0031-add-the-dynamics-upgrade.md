---
id: T0031
title: Add the Dynamics upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T21:07:50Z
claimed_at: 2026-10-26T21:07:52Z
designer: desktop
---

## Goal
A second trade-off card: Dynamics buys raw damage with move speed, so damage builds get a glass-cannon option alongside Allegro's fire-rate-for-speed trade.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `allegro` entry is the closest example: two mods, one of them a move-speed penalty). Append after whatever entry is last — T0029 (Ostinato) may land first and be the new last entry.
- Values: `id: 'dynamics'`, `name: 'Dynamics'`, `description: '+20% damage, -8% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow`.
- `mods`: two mods — copy the damage mod from the `weight` entry (same stat, same op) with value 1.20, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value 0.92.
- At 3 levels: ≈ ×1.73 damage, ≈ ×0.78 move speed.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Dynamics up to 3 times; each level multiplies damage by 1.20 and move speed by 0.92 (3 levels ≈ ×1.73 damage, ≈ ×0.78 move speed)
- [ ] It stacks normally with Weight, Emphasis and Momentum
- [ ] `npm run check` and `npm run smoke` pass
