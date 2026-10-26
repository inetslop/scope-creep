---
id: T0002
title: Add the Tempo upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
claimed_at: 2026-10-26T18:59:22Z
designer: asus
---

## Goal
A new hybrid upgrade that makes the player a bit faster at everything.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the `UPGRADES` array, after `composition`, in the same style as the others.
- Values: `id: 'tempo'`, `name: 'Tempo'`, `description: '+8% move speed, +8% fire rate'`, `maxLevel: 3`, `weight: 6`, `color: PALETTE.orange`.
- `mods`: `{ stat: 'moveSpeed', op: 'mul', value: 1.08 }` and `{ stat: 'fireRateMul', op: 'mul', value: 1.08 }`.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] `npm run check` and `npm run smoke` pass
