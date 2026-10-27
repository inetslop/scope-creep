---
id: T0056
title: Add the Pizzicato upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T01:47:24Z
---

## Goal
A rare fast-pierce level-up card for players who want their shots to fly faster and punch through more enemies, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Glissando entry).
- `id: 'pizzicato'`, display name "Pizzicato", description `'+1 pierce, +10% projectile speed'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.ink` (same ink color as the `draft` entry).
- Two mods, copied from existing entries:
  - the pierce mod from the `ostinato` entry (same stat and op) — +1 pierce per level,
  - the projectile-speed mod from the `draft` entry (same stat and op) with value 1.10 (+10% projectile speed per level).
- At max level: +2 pierce and ×1.21 projectile speed; stacks with other cards that use the same stats (Vector, Ostinato, Draft, Fugue, Presto, Staccato, …).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `glissando`/`tessitura` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Pizzicato" appears as an ink-colored level-up card in the three-card choice, reading "+1 pierce, +10% projectile speed".
- [ ] Picking it adds +1 pierce to all weapon projectiles and +10% projectile speed per level; at 2 levels, +2 pierce and ×1.21 projectile speed.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
