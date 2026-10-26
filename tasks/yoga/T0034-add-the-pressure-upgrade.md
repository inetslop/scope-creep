---
id: T0034
title: Add the Pressure upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T21:54:06Z
---

## Goal
A new level-up card for the "hit hard and often" build — a pure damage + fire-rate combo that reuses two existing stats, no new mechanics.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'pressure'`, `name: 'Pressure'`, `description: '+10% damage, +10% fire rate'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods — copy the damage mod from the `emphasis` entry (same stat, same op) with value 1.10, and copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.10.
- At 3 levels: ×1.33 damage and ×1.33 fire rate (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Pressure up to 3 times; each level multiplies damage by 1.10 and fire rate by 1.10 (3 levels ≈ ×1.33 each)
- [ ] It stacks with Weight/Emphasis (damage) and Rhythm/Allegro (fire rate) normally
- [ ] `npm run check` and `npm run smoke` pass
