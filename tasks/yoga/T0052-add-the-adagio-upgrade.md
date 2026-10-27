---
id: T0052
title: Add the Adagio upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:32:39Z
---

## Goal
A new defensive-sustain level-up card — max HP plus steady regeneration — added as one entry in the upgrade table.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tessitura entry).
- `id: 'adagio'`, display name "Adagio", description `'+6 max HP, +0.5 HP/s regen'`.
- `maxLevel: 3`, roll `weight: 5`, `color: PALETTE.yellow`.
- Two mods, copied from existing entries:
  - the max-HP mod from the `tessitura` entry (same stat and op) with value 6 (+6 max HP per level),
  - the regen mod from the `balance` entry (same stat and op) with value 0.5 (+0.5 HP/s per level).
- At max level: +18 max HP and +1.5 HP/s regen; stacks with Mass, Plate, Tessitura and Balance.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tessitura`/`trill` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Adagio" appears as a yellow level-up card in the three-card choice, reading "+6 max HP, +0.5 HP/s regen".
- [ ] Picking it raises max HP by 6 (the HP bar's maximum grows) and adds 0.5 HP/s regeneration per level, ticking the same way Balance's regen ticks.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
