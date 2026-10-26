---
id: T0010
title: Add the Mote enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T17:40:33Z
---

## Goal
A tiny fast circle that shows up in numbers — swarm pressure in the mid-game.

## Details
- Create `src/content/enemies/mote.ts`. Copy `src/content/enemies/wedge.ts` and change it.
- Values: `id: 'mote'`, `name: 'Mote'`, `hp: 6`, `speed: 150`, `contactDamage: 4`, `xp: 1`, `threat: 1`, `spawnWeight: 8`, `unlockAtSec: 45`, `behavior: 'chase'`, `knockbackResist: 0`.
- Look: `shape: 'circle'` (same shape as the player), `radius: 7`, `body: PALETTE.ink`, `accent: PALETTE.paperLight`, `spin: 0`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] `src/content/enemies/mote.ts` exists with exactly the values above
- [ ] `mote` is in the `ENEMIES` array
- [ ] `npm run check` and `npm run smoke` pass
