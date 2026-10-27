---
id: T0073
title: Add the Tenuto upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T04:08:50Z
claimed_at: 2026-10-27T04:12:33Z
designer: yoga
---

## Goal
An "armored hammer" level-up card — armor plus damage on one card — the first card to pair the defensive axis with the offensive axis, for players who want to wade into the swarm and hit back harder.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067) and Arpeggio (T0069) entries). Open the file first and append after whichever entry is currently last — T0072 (Legato, also on yoga) runs before this one, and the open tasks T0069 (Arpeggio, yoga) and T0055 (Counterpoint, desktop-4070) may also have appended to this array, so never assume which entry is last.
- `id: 'tenuto'`, display name "Tenuto", description `'+1 armor, +10% damage'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the defensive cards `plate` and `pedal`).
- Two mods, copied from existing entries:
  - the +1 armor mod from the `plate` entry (same stat and op, value 1) — +1 armor per level,
  - the +10% damage mod from the `pressure` entry (same stat and op, value 1.10) — +10% damage per level.
- At max level: +3 armor and ≈×1.33 damage; stacks with the other cards that use those stats (Mass/Plate/Pedal for armor, Weight/Emphasis/Pressure/Accent for damage).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Tenuto" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +10% damage".
- [ ] Picking it adds +1 armor and +10% damage per level; at 3 levels, +3 armor and ≈×1.33 damage (the player visibly shrugs off more hits and their damage numbers go up).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
