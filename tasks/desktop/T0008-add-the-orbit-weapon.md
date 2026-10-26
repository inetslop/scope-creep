---
id: T0008
title: Add the Orbit weapon
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T17:40:33Z
---

## Goal
A new weapon: three circles that orbit the player and damage enemies on contact — a defensive, close-range build that changes how the player moves.

## Details
- New weapon "Orbit" in the weapon system, unlocked and selected the same way as Line.
- While selected: 3 blue circles (radius 8, ink outline) orbit the player at radius 70, orbit speed 2.5 rad/s, evenly spaced (120° apart). They must not hide the player.
- On contact with an enemy: 12 damage, small knockback (0.3). A given enemy can be hit by orbit circles at most once per 0.6 s.
- Orbit fires no projectiles; Point and Line work as usual when selected instead.
- New upgrade in `UPGRADES` (same shape as the Line entry): `id: 'orbit'`, `name: 'Orbit'`, `description: 'New weapon: 3 circles that orbit you and damage enemies on contact'`, `maxLevel: 1`, `weight: 5`, `color: PALETTE.blue`.

## Acceptance criteria
- [ ] The level-up menu offers the Orbit upgrade once; picking it unlocks the Orbit weapon, selectable like Line
- [ ] While Orbit is selected, 3 blue circles orbit the player and damage enemies on contact
- [ ] A given enemy takes at most one orbit hit per 0.6 s
- [ ] Switching back to Point or Line works as usual
- [ ] `npm run check` and `npm run smoke` pass
