---
id: T0048
title: Add the Tessitura upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:03:46Z
---

## Goal
A pure survival ramp between Mass and Plate: Tessitura adds +10 max HP per level (5 levels), giving defensive players a long, cheap way to get thicker before the late game catches up.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pulse, Sweep and Trill entries).
- `id: 'tessitura'`, display name "Tessitura".
- `maxLevel: 5`, roll `weight: 4`, `color: PALETTE.yellow` (the defensive color, matching Plate).
- One mod, copied from the `mass` entry: the max-HP mod, but with value 10 (+10 max HP per level).
- At max level: +50 max HP. Stacks with Mass and Plate.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pulse`/`trill` test pattern: assert the exact mod, apply it 5 times, and assert it is offered 5 times then stops.

## Acceptance criteria
- [ ] "Tessitura" appears as a yellow level-up card named "Tessitura" in the three-card choice.
- [ ] Picking it raises the player's max HP by 10 (the HP bar's maximum grows); at 5 levels the player has +50 max HP over baseline.
- [ ] After 5 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
