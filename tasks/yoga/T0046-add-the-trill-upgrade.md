---
id: T0046
title: Add the Trill upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T23:43:51Z
---

## Goal
A rare repeat-fire card for the volley build: Trill adds an extra projectile and a fire-rate bump, giving Repetition/Rhythm players a strong endgame pick.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pulse and Sweep entries).
- `id: 'trill'`, display name "Trill".
- `maxLevel: 2`, roll `weight: 3` (rare, matching the Ostinato entry), `color: PALETTE.red`.
- Two mods, copied from existing entries:
  - +1 projectile per volley — copy the exact projectile-count mod from the `repetition` entry.
  - ×1.08 fire rate per level — copy the fire-rate mod from the `rhythm` entry, but with a 1.08 multiplier.
- At max level: +2 projectiles per volley and ≈×1.166 fire rate. Stacks with Repetition, Rhythm, Tempo and every other fire-rate card.

## Acceptance criteria
- [ ] "Trill" appears as a red level-up card named "Trill" in the three-card choice.
- [ ] Picking it adds +1 projectile to every volley and +8% fire rate; picking it a second time adds another +1 projectile and +8% fire rate.
- [ ] After 2 levels it is never offered again (covered by the existing upgrade roll test).
