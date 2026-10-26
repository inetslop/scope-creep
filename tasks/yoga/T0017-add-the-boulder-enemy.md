---
id: T0017
title: Add the Boulder enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T19:20:22Z
---

## Goal
A heavy late-game chaser: a big yellow circle that slowly plows toward you and shrugs off knockback — the "yellow = heavy" pillar in a new shape.

## Details
- Create `src/content/enemies/boulder.ts`. Copy `src/content/enemies/block.ts` and change it.
- Values: `id: 'boulder'`, `name: 'Boulder'`, `hp: 60`, `speed: 60`, `contactDamage: 15`, `xp: 4`, `threat: 3`, `spawnWeight: 3`, `unlockAtSec: 90`, `behavior: 'chase'`, `knockbackResist: 0.6`.
- Look: `shape: 'circle'`, `radius: 22`, `body: PALETTE.yellow`, `accent: PALETTE.ink`, `spin: 0`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array).

## Acceptance criteria
- [ ] `src/content/enemies/boulder.ts` exists with exactly the values above
- [ ] `boulder` is in the `ENEMIES` array
- [ ] After 90 s a large yellow circle can appear that slowly chases and barely flinches when hit
- [ ] `npm run check` and `npm run smoke` pass
