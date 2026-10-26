---
id: T0026
title: Add the Allegro upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T20:32:24Z
claimed_at: 2026-10-26T20:33:40Z
designer: desktop
---

## Goal
The first trade-off upgrade: Allegro buys fire rate with move speed, so aggressive builds make a real choice at level-up instead of pure stacking.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'allegro'`, `name: 'Allegro'`, `description: '+15% fire rate, -8% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- `mods`: two mods — copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.15, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value 0.92.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Allegro up to 3 times, and each level multiplies fire rate by 1.15 and move speed by 0.92 (3 levels ≈ ×1.52 fire rate, ×0.78 move speed)
- [ ] `npm run check` and `npm run smoke` pass
