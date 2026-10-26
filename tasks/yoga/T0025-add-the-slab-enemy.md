---
id: T0025
title: Add the Slab enemy
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T20:32:24Z
claimed_at: 2026-10-26T20:32:26Z
designer: desktop
---

## Goal
A slow, huge, heavy wall for late runs: after 2:00 a big yellow square crawls across the page that you can barely push and that hurts to touch — a positioning threat, not a chase threat.

## Details
- Create `src/content/enemies/slab.ts`. Copy `src/content/enemies/boulder.ts` and change it: keep `behavior: 'chase'` and the same overall structure, but use the square shape (the same shape value `tile.ts` uses) and the values below.
- Values: `id: 'slab'`, `name: 'Slab'`, `hp: 140`, `speed: 45`, `contactDamage: 18`, `xp: 6`, `threat: 4`, `spawnWeight: 2`, `unlockAtSec: 120`, `behavior: 'chase'`, `knockbackResist: 0.8`.
- Look: `radius: 24`, `body: PALETTE.yellow`, `accent: PALETTE.ink`, `spin: 0.1`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array, same import/entry style as the others).
- It drops normal shards; no special drops, no splitting.

## Acceptance criteria
- [ ] `src/content/enemies/slab.ts` exists with exactly the values above
- [ ] `slab` is in the `ENEMIES` array
- [ ] After 120 s a big yellow square can appear that crawls slowly, shrugs off knockback almost completely, and hurts more on contact than a Boulder
- [ ] `npm run check` and `npm run smoke` pass
