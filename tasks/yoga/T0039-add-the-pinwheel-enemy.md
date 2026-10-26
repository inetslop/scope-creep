---
id: T0039
title: Add the Pinwheel enemy
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:47:02Z
designer: desktop
---

## Goal
A new late-run enemy for variety — a red square that spins fast while chasing, reading at a glance as "spinning danger" and adding a new shape to the mid/late pack.

## Details
- This is a data-file task modeled on an existing chaser. Create `src/content/enemies/pinwheel.ts` by copying `src/content/enemies/tile.ts` (a square chaser) and changing the values. Register it in `ENEMIES` in `src/content/enemies/index.ts` (import in alphabetical position, entry appended in unlock order — 165 s is the latest unlock), exactly like the other enemies.
- Look: a red square — `shape: 'square'`, `radius: 14`, `body: PALETTE.red`, `accent: PALETTE.ink`, `spin: 2.4` (fast spin — its defining trait; the Spike spins at 1.5). Thick ink outline and the hard paper-cut shadow like every other shape.
- Behavior: `chase` — it travels straight toward the player like the Tile and Hex.
- Values: `id: 'pinwheel'`, `name: 'Pinwheel'`, `hp: 24`, `speed: 112`, `contactDamage: 11`, `xp: 2`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 165`, `knockbackResist: 0.3`.
- First-encounter marginalia note (all caps, dry): `SPINS AS IT CHASES`.

## Acceptance criteria
- [ ] `src/content/enemies/pinwheel.ts` exists with the values above and `pinwheel` is registered in `ENEMIES`
- [ ] From ~165 s into a run, red spinning squares can spawn; before 165 s they never appear
- [ ] A Pinwheel chases the player straight and spins fast (visibly rotating) as it moves, unlike the non-spinning Mote
- [ ] On its first appearance in a run, the marginalia label "SPINS AS IT CHASES" fades in above it for 2 s
- [ ] The spawn unlock timing test still passes (Pinwheel absent before 165 s, present at/after)
- [ ] `npm run check` and `npm run smoke` pass
