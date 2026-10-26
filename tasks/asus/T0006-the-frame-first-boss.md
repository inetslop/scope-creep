---
id: T0006
title: The Frame — first boss
assignee: asus
size: L
priority: 1
status: design
depends_on: [T0005]
attempts: 0
created: 2026-10-26T17:40:33Z
---

## Goal
At 5:00 a boss appears: a giant picture frame that charges at the player, spawns rings of wedges and bursts of ink darts, with a health bar at the top of the screen. Killing it is the run's first big moment, and it returns every 5 minutes, tougher.

## Details
- Boss "The Frame": a large ink square outline (a frame, ~160 units wide, 10 units thick) with a red square core (40 units) at its center. HP 1200, contact damage 20, speed 40 (drifts slowly toward the player).
- At 5:00 a 1 s warning: the text "THE FRAME" in large ink caps at screen center. Then the frame slides in from the top edge of the arena over 0.5 s. While the boss is alive the spawn director pauses all normal and elite spawns; they resume when it dies.
- Health bar: top center, 60% of screen width, 12 units tall, ink outline, red fill that drains. Above it, the name "THE FRAME" in small ink caps. Visible only while the boss is alive; fade out over 0.5 s on death.
- Attack patterns, cycling every 4 s, each preceded by a 0.6 s telegraph (the red core flashes paperLight):
  1. Charge: the frame dashes toward the player's position at speed 400 for 0.8 s; contact damage is 25 during the dash.
  2. Ring: spawn 10 red wedges (hp 10, speed 160, contactDamage 8) in a circle around the frame, facing outward.
  3. Burst: fire 12 slow ink darts (speed 150, damage 8 — the same values as the Sentry's shots) radially outward from the red core, reusing the existing enemy-bullet system.
- On death: shatter into 40 ink fragments, large screen shake, drop 30 xp as 10 pickups scattered around the death point. The next boss appears at 10:00 with 50% more HP (1800), then 2700, and so on.
- Add `bossKills` to `hook.stats` in `debug/testHook.ts`.
- Unit test in `tests/core/`: boss timer (first at 300 s, then 300 s after each death).

## Acceptance criteria
- [ ] At 5:00 the warning shows and The Frame enters the arena; normal and elite spawning stops while it is alive and resumes after
- [ ] The health bar with its name is visible at the top of the screen while the boss lives and fades out on death
- [ ] The boss telegraphs then cycles charge, wedge ring and radial dart burst roughly every 4 s
- [ ] The boss can be killed: it shatters, shakes the screen, and drops about 30 shards as multiple pickups
- [ ] The next boss appears 5 minutes later with 50% more HP
- [ ] Unit test for the boss timer in `tests/core/`
