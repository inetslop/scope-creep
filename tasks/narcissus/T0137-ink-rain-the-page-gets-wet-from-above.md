---
id: T0137
title: Ink rain — the page gets wet from above
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
claimed_at: 2026-10-27T19:14:01Z
designer: desktop
---

## Goal
After 10:00 the page starts raining ink: drops fall from the top of the page and splat into slow puddles — the earliest late-run hazard on the clock, and the warning that the Gutter (14:00) and Tide (16:00) are coming.

## Details
- From 10:00 (600 s), ink drops fall from the top of the page: one every 1.4 s (seeded jitter ±0.2 s), at a random x inside the crop-safe rect (the same rect the spawn director uses), falling straight down at 150 u/s. A drop is a small flat ink circle (radius 6, no outline or shadow — the flat idiom of the enemy trails, T0126).
- A drop that reaches the bottom of the safe rect splats and is gone, leaving a flat ink puddle 100 u across: 3.0 s life, fading over the last 0.5 s, slowing the player 25% while their center is inside — the Wash puddle idiom (T0111) at a stronger value — and it combines with other slows exactly the way two Wash puddles do today.
- Pooled: at most 8 live puddles, oldest recycled.
- The drops are weather, not enemies: no contact damage, untargetable, no collision, unaffected by weapons.
- Sound: a splat plays the existing paper slap (T0099) at half gain, throttled to one per 300 ms.
- Teaching: the first splat of a run prints the marginalia "THE PAGE RAINS" (the T0027 idiom, 2 s).
- The schedule is a pure module + unit tests in the crop/gutter pattern (T0045/T0099): no drops before 600 s, the first at 600 s, ~1.4 s spacing (within the jitter) after, seeded-deterministic.
- No new key, HUD element or scene.

## Acceptance criteria
- [ ] Before 10:00 nothing rains; from 10:00 a drop falls about every 1.4 s from inside the safe rect, and the first splat prints "THE PAGE RAINS".
- [ ] Each splat leaves a 100 u ink puddle lasting 3.0 s; a player standing inside (center) moves 25% slower, two puddles at once combine the way two Wash puddles do, and the puddle fades out on schedule.
- [ ] Drops deal no damage and cannot be shot; at most 8 puddles are on the page at once.
- [ ] The schedule is seeded-deterministic with no drops before 600 s (unit tests); no new key, HUD element or scene.
