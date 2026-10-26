---
id: T0020
title: Add the Emphasis upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:03:55Z
designer: desktop
---

## Goal
A second, slower damage ramp so damage builds have room to grow past Weight.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'emphasis'`, `name: 'Emphasis'`, `description: '+15% damage'`, `maxLevel: 5`, `weight: 5`, `color: PALETTE.ink`.
- `mods`: a single mod that multiplies the same damage stat that the `weight` entry uses — copy that entry's damage mod (same stat, same op) with value 1.15.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Emphasis up to 5 times, and each level multiplies damage by 1.15 (5 levels ≈ ×2.01 total)
- [ ] `npm run check` and `npm run smoke` pass
