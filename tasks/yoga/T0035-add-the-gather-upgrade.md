---
id: T0035
title: Add the Gather upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T21:54:06Z
---

## Goal
A new level-up card for the "shard economy" build — pull shards in from farther away and make them worth more, so a greedy playstyle snowballs.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'gather'`, `name: 'Gather'`, `description: '+25% pickup radius, +15% shard XP'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow`.
- `mods`: two mods — copy the pickup-radius mod from the `gravity` entry (same stat, same op) with value 1.25, and copy the shard-XP mod from the `composition` entry (same stat, same op) with value 1.15.
- At 3 levels: ×1.95 pickup radius and ×1.52 shard XP (1.25³ ≈ 1.95, 1.15³ ≈ 1.52).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Gather up to 3 times; each level multiplies shard pickup radius by 1.25 and shard XP by 1.15
- [ ] It stacks with Gravity (pickup radius) and Composition (shard XP) normally
- [ ] `npm run check` and `npm run smoke` pass
