---
id: T0028
title: Add the Spike enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:55:07Z
---

## Goal
A small, fast red punisher: hugging the swarm gets you stung.

## Details
- Create `src/content/enemies/spike.ts`. Copy `src/content/enemies/hex.ts` (the same chase-behavior pattern as Tile and Slab) and change the values.
- Values: `id: 'spike'`, `name: 'Spike'`, `hp: 10`, `speed: 130`, `contactDamage: 14`, `xp: 2`, `threat: 2`, `spawnWeight: 5`, `unlockAtSec: 75`, `behavior: 'chase'`, `knockbackResist: 0.1`.
- Look: `shape: 'triangle'` (the same shape value `splinter` uses), `radius: 10`, `body: PALETTE.red`, `accent: PALETTE.paperLight`, `spin: 1.5`.
- Never splits (no `splitsInto` field).
- Register it in `ENEMIES` in `src/content/enemies/index.ts` with the import in alphabetical position, exactly like the Tile and Slab entries.
- No engine changes: the `chase` behavior and the triangle texture already exist.

## Acceptance criteria
- [ ] `src/content/enemies/spike.ts` exists with exactly the values above and no `splitsInto` field
- [ ] `spike` is in the `ENEMIES` array
- [ ] From ~75 s into a run, small red spinning triangles can appear that chase the player and hurt 14 on contact
- [ ] `npm run check` and `npm run smoke` pass
