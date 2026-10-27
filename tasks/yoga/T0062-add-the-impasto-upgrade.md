---
id: T0062
title: Add the Impasto upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T02:46:28Z
---

## Goal
A rare "heavy volley" level-up card — an extra projectile plus solid damage on one card — for players who want their volleys to hit like a rolling pin, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pizzicato and Pedal entries). Open the file first and append after whichever entry is currently last — open task T0055 (Counterpoint, on desktop-4070) also appends a card to this array, so never assume which entry is last.
- `id: 'impasto'`, display name "Impasto", description `'+1 projectile per volley, +15% damage'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.red` (same red as the `trill` entry — the other rare +1 projectile card).
- Two mods, copied from existing entries:
  - the +1 projectile-per-volley mod from the `repetition` entry (same stat and op) — +1 projectile per level,
  - the +15% damage mod from the `emphasis` entry (same stat and op) — +15% damage per level.
- At max level: +2 projectiles per volley and +30% damage; stacks with the other cards that use those stats (Repetition/Trill for projectiles, Weight/Emphasis/Fugue/Pressure/Dynamics for damage).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`pedal` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Impasto" appears as a red level-up card in the three-card choice, reading "+1 projectile per volley, +15% damage".
- [ ] Picking it adds +1 projectile per volley and +15% damage per level; at 2 levels, +2 projectiles per volley and +30% damage.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
