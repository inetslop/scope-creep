---
id: T0122
title: Boss shatter — a boss kill is a breather and a payday
assignee: cachyos-x8664
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
claimed_at: 2026-10-27T16:04:53Z
designer: desktop
---

## Goal
The moment any boss dies, every enemy projectile on screen bursts into shards — the fight clears into loot, and a boss kill is a breather as well as a win.

## Details
- The moment any boss dies (The Frame, The Grid, The Palette — and The Press once T0116 lands), every enemy projectile on screen converts into one normal shard at its position: the projectile is removed, and a standard shard spawns in its place through the normal shard-drop path — standard size, motion and XP, and the 5% gilt roll (T0112) applies to these drops like any other.
- A small flat ink ring pops at each converted position (reuse the existing ring FX, small) so the shatter reads as one beat.
- The standard boss death plays exactly as it does today, on top of the shatter: the shake (T0040), the sting (T0058), the boss-music return (T0108) and the "+50" kill feed (T0106) are all unchanged.
- The conversion happens exactly once per boss death, at the moment of death; enemy projectiles that exist after the death are normal projectiles again.
- No new HUD element, key, scene or sound (the ring is visual only); no change to shard values or pickup rules.

## Acceptance criteria
- [ ] The moment any boss dies, every enemy projectile on screen becomes exactly one normal shard at its position, with a small flat ink ring at each position; the converted projectiles are gone.
- [ ] The converted shards are collectible like normal shards (standard XP, standard pickup radius, the gilt roll applies); the number of shards equals the number of enemy projectiles on screen at the moment of death.
- [ ] The standard boss death plays unchanged (shake, sting, music return, "+50" kill feed); enemy projectiles that exist after the death behave as normal projectiles.
- [ ] No new HUD element, key, scene or sound is added; `npm run check` and `npm run smoke` pass.
