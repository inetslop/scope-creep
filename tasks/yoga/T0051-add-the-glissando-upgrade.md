---
id: T0051
title: Add the Glissando upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:32:39Z
---

## Goal
A new economy-DPS level-up card that reuses two existing stats, added as one entry in the upgrade table.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tessitura entry).
- `id: 'glissando'`, display name "Glissando", description `'+15% shard XP, +10% fire rate'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow`.
- Two mods, copied from existing entries:
  - the shard-XP mod from the `gather` entry (same stat and op) with value 0.15 (+15% shard XP per level),
  - the fire-rate mod from the `rhythm` entry (same stat and op) with value 0.10 (+10% fire rate per level).
- At max level: ×1.52 shard XP and ×1.33 fire rate; stacks with other cards that use the same stats (Composition, Gather, Rhythm, Tempo, …).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tessitura`/`trill` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Glissando" appears as a yellow level-up card in the three-card choice, reading "+15% shard XP, +10% fire rate".
- [ ] Picking it raises shard XP by 15% and fire rate by 10% per level; at 3 levels, ×1.52 shard XP and ×1.33 fire rate.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
