---
id: T0110
title: Platen dust — the slam kicks up paper dust
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T13:08:21Z
claimed_at: 2026-10-27T13:36:42Z
designer: desktop
---

## Goal
The moment the Platen's slam shockwave fires (T0091), three small paper-dust puffs pop at the Platen — the shove gets physicality, seen at the exact moment the page lurches.

## Details
- The moment the Platen's slam shockwave fires (the existing slam moment in its 5 s cycle — the same instant the ink shockwave shoves the player and nearby enemies), spawn three flat paperLight circles at the Platen's center: radius 4–7 units, no outline, no shadow.
- Each puff drifts outward 10–20 units at a random angle (chosen with the run's seeded RNG, like the other spawn-driven visuals) and fades linearly over 400 ms, then is discarded.
- Closest example: the streak-break ink specks (T0101) — the same flat dot style, the same scatter-and-fade shape; this is that juice for the Platen's slam, reusing the Platen's existing slam trigger, not a new one.
- No sound. No gameplay change: the Platen's 60 hp, speed 20, 160-unit slam radius, shove and 5 s cycle are untouched. No HUD, no input, no scene, no content file.

## Acceptance criteria
- [ ] The moment the Platen's slam shockwave fires, three small paperLight puffs (radius 4–7) pop at the Platen's center, drift outward 10–20 units and are gone within 400 ms.
- [ ] No puffs at any other moment — not on spawn, not on the flatten telegraph, not on contact, not while the Platen crawls.
- [ ] No new sound plays, the Platen's hp, speed, slam radius, shove and 5 s cycle are unchanged, and no HUD element, input or scene is added.
- [ ] `npm run check` and `npm run smoke` pass.
