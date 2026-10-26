---
id: T0033
title: Add the Fugue upgrade
assignee: yoga
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-26T21:23:27Z
---

## Goal
A new level-up card for the "hit harder, faster" build — a pure stat combo that reuses two existing stats, no new mechanics.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `ostinato` entry is the closest example: two mods).
- Values: `id: 'fugue'`, `name: 'Fugue'`, `description: '+15% damage, +15% projectile speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.ink`.
- `mods`: two mods — copy the damage mod from the `emphasis` entry (same stat, same op) with value 1.15, and copy the projectile-speed mod from the `draft` entry (same stat, same op) with value 1.15.
- At 3 levels: ×1.52 damage and ×1.52 projectile speed (1.15³ ≈ 1.52).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Fugue up to 3 times; each level multiplies damage by 1.15 and projectile speed by 1.15 (3 levels ≈ ×1.52 each)
- [ ] It stacks with Weight/Emphasis and Draft/Staccato normally
- [ ] `npm run check` and `npm run smoke` pass
