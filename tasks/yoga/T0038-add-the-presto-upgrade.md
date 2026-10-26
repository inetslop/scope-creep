---
id: T0038
title: Add the Presto upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: [T0037]
attempts: 0
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:45:07Z
designer: desktop
---

## Goal
An "everything is fast" build. The "Presto" card raises both projectile speed and move speed, so bullets arrive sooner and you close distance faster — a pure velocity build with no damage or fire-rate cost.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'presto'`, `name: 'Presto'`, `description: '+10% projectile speed, +10% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods — copy the projectile-speed mod from the `draft` entry (same stat, same op) with value `1.10`, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value `1.10`.
- At 3 levels: ×1.33 projectile speed and ×1.33 move speed (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Presto up to 3 times; each level multiplies projectile speed and move speed by 1.10
- [ ] It stacks with Draft (projectile speed) and Momentum (move speed) normally
- [ ] `npm run check` and `npm run smoke` pass
