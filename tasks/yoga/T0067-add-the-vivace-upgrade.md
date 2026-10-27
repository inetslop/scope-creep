---
id: T0067
title: Add the Vivace upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T03:21:30Z
---

## Goal
A rare "fast swarm" level-up card — an extra projectile plus a projectile-speed bump on one card — for players who want their volleys to throw a quick spread, reusing two existing stats. It fills the gap between Impasto (heavy volleys) and Trill (rapid volleys).

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pizzicato, Pedal and Impasto entries). Open the file first and append after whichever entry is currently last — open task T0055 (Counterpoint, on desktop-4070) also appends to this array, so never assume which entry is last.
- `id: 'vivace'`, display name "Vivace", description `'+1 projectile per volley, +10% projectile speed'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.orange` (same orange as the `presto`/`staccato` entries — the other speed cards).
- Two mods, copied from existing entries:
  - the +1 projectile-per-volley mod from the `repetition` entry (same stat and op) — +1 projectile per level,
  - the +10% projectile-speed mod from the `draft` entry (same stat and op, value 1.10 as in `presto`) — +10% projectile speed per level.
- At max level: +2 projectiles per volley and ≈×1.21 projectile speed; stacks with the other cards that use those stats (Repetition/Trill/Impasto for projectiles, Draft/Presto/Fugue for projectile speed).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Vivace" appears as an orange level-up card in the three-card choice, reading "+1 projectile per volley, +10% projectile speed".
- [ ] Picking it adds +1 projectile per volley and +10% projectile speed per level; at 2 levels, +2 projectiles per volley and ≈×1.21 projectile speed.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
