---
id: T0012
title: Add the Draft upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T17:58:28Z
claimed_at: 2026-10-26T19:14:19Z
designer: desktop
---

## Goal
A new upgrade that makes projectiles fly faster — a third axis for weapon builds alongside Rhythm (fire rate) and Weight (damage).

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'draft'`, `name: 'Draft'`, `description: '+25% projectile speed'`, `maxLevel: 3`, `weight: 5`, `color: PALETTE.ink`.
- `mods`: a single mod that multiplies projectile speed by 1.25 — copy the stat structure the `rhythm` entry uses for its fire-rate mod, but use the stat that controls how fast a weapon's projectiles travel.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] Picking Draft makes all projectiles visibly faster
- [ ] `npm run check` and `npm run smoke` pass
