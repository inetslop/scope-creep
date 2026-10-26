---
id: T0016
title: Add the Plate upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T19:20:22Z
---

## Goal
A new defensive upgrade for players who want to tank: pure armor, no other effects.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'plate'`, `name: 'Plate'`, `description: '+1 armor'`, `maxLevel: 2`, `weight: 5`, `color: PALETTE.yellow`.
- `mods`: a single mod that adds 1 armor — copy the armor mod from the `mass` entry (same stat, same op, value 1).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Plate up to 2 times, and each level grants the same armor as the `mass` entry's armor mod
- [ ] `npm run check` and `npm run smoke` pass
