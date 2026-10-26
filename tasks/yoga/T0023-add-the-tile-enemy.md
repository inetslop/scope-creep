---
id: T0023
title: Add the Tile enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:18:38Z
---

## Goal
A mid-tier chaser in a new shape: a green square that chases at medium speed — steady pressure between the fast Hex and the slow Boulder.

## Details
- Create `src/content/enemies/tile.ts`. Copy `src/content/enemies/splitter.ts` and change it: keep the square shape value and the ink accent from splitter, but remove the `splitsInto` field so it never splits on death.
- Values: `id: 'tile'`, `name: 'Tile'`, `hp: 35`, `speed: 95`, `contactDamage: 12`, `xp: 3`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 105`, `behavior: 'chase'`, `knockbackResist: 0.3`.
- Look: `radius: 16`, `body: PALETTE.green`, `accent: PALETTE.ink`, `spin: 0.4`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array).

## Acceptance criteria
- [ ] `src/content/enemies/tile.ts` exists with exactly the values above and no `splitsInto` field
- [ ] `tile` is in the `ENEMIES` array
- [ ] After 105 s a green square can appear that chases at medium speed and never splits on death
- [ ] `npm run check` and `npm run smoke` pass
