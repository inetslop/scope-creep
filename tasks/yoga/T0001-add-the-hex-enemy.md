---
id: T0001
title: Add the Hex enemy
assignee: yoga
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
---

## Goal
A new mid-game enemy: a green hexagon that is a bit tougher and faster than a Wedge and shows up after 20 seconds, so the early game gets variety.

## Details
- Create `src/content/enemies/hex.ts`. Copy `src/content/enemies/wedge.ts` and change it.
- Values: `id: 'hex'`, `name: 'Hex'`, `hp: 20`, `speed: 115`, `contactDamage: 10`, `xp: 2`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 20`, `behavior: 'chase'`, `knockbackResist: 0.2`.
- Look: `shape: 'hexagon'`, `radius: 15`, `body: PALETTE.green`, `accent: PALETTE.paperLight`, `spin: -1.5`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] `src/content/enemies/hex.ts` exists with exactly the values above
- [ ] `hex` is in the `ENEMIES` array
- [ ] `npm run check` and `npm run smoke` pass
