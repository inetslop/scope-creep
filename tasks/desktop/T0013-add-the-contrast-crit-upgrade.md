---
id: T0013
title: Add the Contrast crit upgrade
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T18:15:01Z
claimed_at: 2026-10-26T19:14:55Z
designer: desktop
---

## Goal
A new upgrade that gives the player a chance to deal double damage, using the crit style already reserved in the damage numbers. Big hits become visible, exciting moments.

## Details
- New upgrade in `src/content/upgrades/index.ts` (same shape as the others; append to the end of the `UPGRADES` array): `id: 'contrast'`, `name: 'Contrast'`, `description: '+10% chance to deal double damage'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- New stat `critChance`, starting at 0: each level of Contrast adds +0.10 (an additive mod, in the same `mods` style as the other entries in that file).
- In `CombatSystem`, whenever the player deals weapon damage to an enemy (projectile hits, and any weapon contact damage such as Orbit's), roll `critChance` with the run's seeded rng. On a crit the damage dealt is exactly 2x, and the floating damage number is shown with the reserved crit style (pass `true` as the `crit` argument to `DamageNumbers.show`).
- A crit changes only the damage value and the number's style: knockback, shard drops and the hit flash are unchanged.
- No UI changes beyond the level-up menu offering the new upgrade like any other.

## Acceptance criteria
- [ ] The level-up menu offers Contrast, up to 3 times
- [ ] With 3 levels of Contrast, about 1 in 3 player hits deals double damage and shows a red, larger damage number
- [ ] Without Contrast, no damage number ever uses the crit style
- [ ] `npm run check` and `npm run smoke` pass
