---
id: T0009
title: Add the Splitter enemy
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T18:39:22Z
designer: desktop
---

## Goal
An enemy that breaks into two on death — killing it makes things briefly worse, so the player thinks about when and where to kill it.

## Details
- New enemy "Splitter": red square, radius 18, body `PALETTE.red`, accent `PALETTE.paperLight`, spin 0.8 (slowly rotating square), behavior `chase`.
- Values: hp 35, speed 70, contactDamage 10, xp 4, threat 3, spawnWeight 3, unlockAtSec 75, knockbackResist 0.4.
- On death: in addition to its normal shard drop, it splits into two small red triangles ("Splinters"): radius 9, hp 8, speed 130, contactDamage 6, xp 1, flying apart in opposite directions along a random axis, then chasing the player.
- Create `src/content/enemies/splitter.ts` (start from a copy of `src/content/enemies/wedge.ts`) and register it and the Splinter in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] After 75 s, slowly rotating red squares appear
- [ ] Killing one spawns two small red triangles that fly apart in opposite directions and chase the player
- [ ] The Splitter still drops its normal shards when it splits
- [ ] `npm run check` and `npm run smoke` pass
