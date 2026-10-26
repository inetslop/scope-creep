---
id: T0018
title: Add the Staccato upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T19:44:48Z
---

## Goal
A new speed build for players: bullets leave the gun faster AND fly faster — the missing link between Rhythm (fire rate only) and Draft (projectile speed only).

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others. The `draft` entry (added in T0012) is the closest model; the `tempo` entry shows how an entry with two mods is written.
- Values: `id: 'staccato'`, `name: 'Staccato'`, `description: '+12% fire rate, +12% projectile speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods, in this order — first the fire-rate mod the `rhythm` entry uses (`op: 'mul'`, value 1.12), then the `projectileSpeedMul` mod the `draft` entry uses (`op: 'mul'`, value 1.12).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu can offer Staccato up to 3 times; each level makes firing measurably faster and projectiles measurably faster
- [ ] `npm run check` and `npm run smoke` pass
