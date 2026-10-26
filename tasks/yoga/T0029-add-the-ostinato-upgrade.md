---
id: T0029
title: Add the Ostinato upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:55:07Z
---

## Goal
A rare build card combining pierce and fire rate — the backbone of a pierce build, alongside Vector and Rhythm.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `allegro` entry is the closest example: two mods).
- Values: `id: 'ostinato'`, `name: 'Ostinato'`, `description: '+1 pierce, +10% fire rate'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink`.
- `mods`: two mods — copy the pierce mod from the `vector` entry (same stat, same op) with value 1, and copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.10.
- At 2 levels: +2 pierce and ×1.21 fire rate.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Ostinato up to 2 times; each level adds +1 pierce and multiplies fire rate by 1.10 (2 levels = +2 pierce, ≈ ×1.21 fire rate)
- [ ] It stacks with Vector and Rhythm normally
- [ ] `npm run check` and `npm run smoke` pass
