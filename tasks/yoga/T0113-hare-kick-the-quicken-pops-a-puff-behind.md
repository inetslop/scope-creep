---
id: T0113
title: Hare kick — the quicken pops a puff behind it
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T13:48:11Z
claimed_at: 2026-10-27T13:54:12Z
designer: yoga
---

## Goal
The Hare's quicken (T0103) is only felt right now — a small ink puff pops behind it the moment it steps up a speed, so the kill you are chasing visibly gets faster.

## Details
- Trigger: the Hare's speed step (computed every frame from its HP fraction by `hareSpeed()` in `src/core/hareSpeed.ts`) increases. The Hare's quicken steering (the case T0103 added in `src/entities/Enemy.ts`) is where the step is known each frame: remember the last step per Hare, and when the current step is higher, fire one puff burst and record the new step. A Hare starts at step 0 and steps only rise (HP never recovers), so at most 3 bursts per Hare's life.
- Burst: three flat ink specks (the TEX dot idiom — no outline, no shadow, same style as the streak-break specks (T0101) and the Platen dust (T0110)), radius 3–5 units, spawned at a point 12 units behind the Hare's center, opposite to the direction it is travelling (if it happens to be stationary, fall back to a random angle from the run's seeded RNG).
- Each speck drifts 15–25 units outward within ±30° of that rear direction and fades linearly over 300 ms, then is discarded. Pool the specks in `src/systems/FxSystem.ts` exactly like the existing Platen dust pool (small pool, oldest slot reused) — closest example: the `slamDust` pool from T0110.
- Elite Hares get the same three specks at the same size. Angles, drifts and radii come from the run's seeded RNG, never `Math.random()`.
- No sound. No gameplay change: the Hare's 24 hp, 40 / 52 / 67.6 / 87.9 speed table, 8 contact damage, 2 XP and 100 s unlock are untouched. No HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] The moment a Hare first enters each higher speed step, exactly one burst of three flat ink specks (radius 3–5) pops 12 units behind it, opposite its travel, drifts 15–25 units and is gone within 300 ms.
- [ ] No puffs at any other moment — not on spawn, not on death, not on contact, not for a step already reached.
- [ ] A Hare killed while at full HP produces no puff.
- [ ] No new sound plays, the Hare's hp / speed table / contact damage / XP / unlock are unchanged, and no HUD element, input or scene is added.
- [ ] `npm run check` and `npm run smoke` pass.
