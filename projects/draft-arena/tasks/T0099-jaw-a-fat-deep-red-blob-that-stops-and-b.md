---
id: T0099
title: "Jaw: a fat deep-red blob that stops and bites a locked cone in front of it"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T16:34:41Z
epic: E20
---

## Goal
The crowd learns a way to threaten no monster has: a monster you cannot face. It stops and bites the ground in front of it, so a player dodges by strafing, not by kiting. This is the menagerie's last slot, back to 10 types.

## Details
- Look: a fat round blob (a squashed circle), radius 26, ink outline, and its face is its mouth: a big round mouth on the front of the body with two small eyes and angry brows above it. Color: a deep red clearly deeper than the Dot's red — a palette color no other monster uses (today's monsters use #ff6b6b Dot, #ffa8a8 Flee, #ffa94d Spitter, #f783ac Zippy, #da77f2 Sleeper, #a78bfa Puff, #845ef7 Brood, plus whatever the Toss and the Twin take; pick the reddest unused step, #fa5252 if it is in the palette). The giant mouth is the tell: in a crowd, a big deep-red round blob whose face is a mouth reads as a Jaw, not a Dot or a Spitter.
- Text (its description): "Stops, opens its giant mouth, then bites everything in front."
- Idle: the mouth is a closed teeth grin; it shuffles toward the nearest player.
- The bite: when a player is within 90 and at least 1.5 s since its last bite, it stops for 0.6 s — the mouth opens wide (a dark opening with 4 white tooth bumps) and the body squashes slightly, the way the Zippy squashes before its dash — with its facing locked for the whole wind-up (the Zippy's fixed-lane rule). Then it bites: a 100° cone, radius 85 from its centre, in its locked facing, one strike, 10 damage (a field, like the Maw's bite; monsters and players alike). The bite lands with a short red ring with an ink rim blooming to radius 85 across the cone over 0.3 s. The mouth closes and it resumes chasing; the next bite is possible 1.5 s after that bite.
- Numbers: hp 50, speed 55 u/s, radius 26, touch damage 6 per second, xp 5, weight 3, fromLevel 4. It spawns and fires nothing (it adds only itself to the crowd — 0 extra critters or shots).
- The wind-up syncs in one of its 4 slots (0 idle, 1 winding up), the way the Zippy syncs its wind-up, so every client sees the open mouth at the same moment.
- What it punishes: standing still in a crowd (a Hive life standing in the swarm, a geyser hold, a stop to grab a gem) and front-on kiting — it reaches 90 and bites while you stand. What counters it: strafing during the 0.6 s wind-up (the cone is locked, so a sidestep puts you outside the 100° wedge), ranged builds (a Lobber bubble, a Goober's Goo, a Gunner's Bolt) that never let it close to 90, and killing it (50 hp, xp 5, its gem). Behind it is safe until it turns back.

## Acceptance criteria
- [ ] A Jaw shuffles toward the nearest player; within 90 of one it stops, holds its open mouth 0.6 s, and bites a 100° cone in front of it for 10 damage, at most once per 1.5 s.
- [ ] A player who strafes out of the locked cone during the 0.6 s wind-up is not hit; whatever stands in the cone when it lands is, monsters and players alike.
- [ ] In a crowd of the other monsters a player tells the Jaw apart at a glance: a fat deep-red round blob whose face is a giant mouth, and the mouth opens before every bite.
- [ ] It spawns from level 4 at its weight (rarer than the Dot), drops the normal gem, and pops into confetti like the others.
- [ ] `npm run check` and `npm run smoke` (desktop and mobile) pass.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | pure touch damage while it touches you; the Jaw stops and bites a locked cone in front — an attack you dodge by strafing, not by running |
| Zippy | stops, changes its look, then commits to a direction locked when the wind-up starts | the Zippy's committed direction is a dash — a path you cross; the Jaw's is a stationary cone bite — a wedge of ground you leave, and the Zippy keeps moving while the Jaw stays still |
| Sleeper | its look changes before it acts | the Sleeper's change is a state flip from still sleep to chase and it has no attack; the Jaw's change telegraphs a bite in a locked direction |
| Brood | a big slow body you have to deal with up close | the Brood answers your closeness by birthing Dots (a crowd multiplier); the Jaw answers it by biting you (a direct attack) |
| Puff | a big slow body in a crowd | the Puff answers being killed by popping into three Dots; the Jaw answers being approached by biting, and nothing happens when it dies |
