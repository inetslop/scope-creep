---
id: T0060
title: Add the Pedal upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
claimed_at: 2026-10-27T02:23:34Z
designer: yoga
---

## Goal
A defensive "tortoise" level-up card — armor plus steady regeneration on one card — for players who want to stay unbroken, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pizzicato entry). Open the file first and append after whichever entry is currently last — open task T0055 (Counterpoint) also appends a card to this array, so never assume which entry is last.
- `id: 'pedal'`, display name "Pedal", description `'+1 armor, +0.5 HP/s regen'`.
- `maxLevel: 2`, roll `weight: 4`, `color: PALETTE.yellow` (same yellow as the `plate` and `adagio` entries).
- Two mods, copied from existing entries:
  - the armor mod from the `plate` entry (same stat and op) — +1 armor per level,
  - the regen mod from the `adagio` entry (same stat and op) — +0.5 HP/s regen per level.
- At max level: +2 armor and +1 HP/s regen; stacks with the other cards that use those stats (Mass, Plate, Balance, Adagio).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`adagio` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Pedal" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +0.5 HP/s regen".
- [ ] Picking it adds +1 armor and +0.5 HP/s regen per level; at 2 levels, +2 armor and +1 HP/s regen.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
