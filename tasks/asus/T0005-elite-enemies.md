---
id: T0005
title: Elite enemies
assignee: asus
size: M
priority: 1
status: design
depends_on: []
attempts: 0
---

## Goal
Every 45 seconds an elite version of a normal enemy appears: bigger, tougher, clearly marked, and worth a pile of shards. Gives the player a mini-objective.

## Details
- Pure logic first: in `src/core/director.ts` add an elite timer to `SpawnDirector` (first elite at 45 s, then every 45 s). `update()` should report elite spawns separately, e.g. return `{ ids: string[]; elites: string[] }`. Pick the elite type from unlocked enemies with the seeded rng. Update the existing callers and the unit test, and add a test for the elite timing.
- `Enemy.spawn()` gets an `elite` flag: scale 1.8x (hitbox too), HP x5, contact damage x1.5, knockback resist +0.5 (max 1).
- Elite marker in the flat style (no glow): a `TEX.ring` image tinted `PALETTE.ink`, scaled to sit just outside the enemy, that follows it and slowly rotates — plus a small `PALETTE.red` square "badge" drawn on the ring. Both are hidden on despawn.
- On death an elite drops shards worth 6x its xp, split into 6 pickups spread around the death point, plus a bigger death effect (2 extra rings).
- Add `elitesSpawned` and `elitesKilled` counters to `hook.stats` in `debug/testHook.ts`.

## Acceptance criteria
- [ ] An elite appears at about 0:45, 1:30, 2:15... and is clearly distinguishable
- [ ] Elites are tougher and drop more shards, split into several pickups
- [ ] Pooled enemies reused after an elite are normal again (no leftover scale, ring or badge)
- [ ] Unit test for elite timing in `tests/core/`
