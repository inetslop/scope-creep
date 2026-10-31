---
id: T0032
title: "Sleeper: a deep pink cushion that sleeps until you get close"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T06:30:37Z
epic: E9
---

## Goal
A 6th monster with a way to survive no other has: it sleeps. A field of sleeping monsters is safe to walk through — until you camp one, and then it wakes, and it is faster than a Dot.

## Details
The closest example is the Zippy monster (a behavior with a synced warning state). One file in src/content/monsters/, registered in its index.
- Behavior, three states: **sleeping** — it does not move and deals no touch damage while no player is within 350 units. **Waking** — a player inside 350 wakes it; its eyes open 0.5 s before it starts moving (that is the warning, synced so every client sees it). **Awake** — it chases the nearest player at 100 u/s, faster than a Dot's 85. It falls back asleep only when no player is within 500, for 10 s (a little squash, eyes close). Between 350 and 500 it keeps whatever state it has. It adds nothing to the crowd but itself: no shots, no spawned monsters.
- Numbers: hp 20, speed 100, radius 15, damage 10 per second of touch (while awake only), xp 3, weight 5, fromLevel 4.
- Look: a rounded square (a squashed cushion), a deep pink darker than Zippy's pink, ink outline. Sleeping: a calm face, two closed eyes (small arcs), a small o mouth. Waking and awake: two open eyes, angry mood, frown mouth.
- What it punishes: standing still — a geyser hold or a gem spot set in a sleeping field is a trap for a build that camps (Chill, Fuse). What counters it: a hit from a distance (a bubble, a bolt) pops it before it wakes.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | a warm critter that chases and drops a gem | Dot is awake and moving all the time; the Sleeper is dormant and safe to cross, and only becomes a chaser after a wake-up you can see coming |
| Puff | a slow critter from the early levels | Puff's own death changes the crowd (it splits into Dots); the Sleeper's state changes with how close you are, and it can sleep again |
| Zippy | a face that warns before it acts | Zippy's warning is a one-shot dash along a lane, then it keeps crawling; the Sleeper's warning is a permanent change — it stops being safe to walk through |
| Spitter | moves around a distance band around a player | Spitter holds its range and shoots from it; the Sleeper has no range at all — it is wherever you let it sleep |
| Snail | a slow warm critter you have to deal with | Snail changes the ground you walk on (sticky patches); the Sleeper changes itself |
| Flee | a critter you have to chase | Flee moves away from you at all times; the Sleeper is still until you are close, then moves toward you |

## Acceptance criteria
- [ ] A crowd of sleepers stands still with closed eyes; walking within 350 units of one opens its eyes 0.5 s before it starts moving.
- [ ] An awake Sleeper chases the nearest player at 100 u/s and deals 10 damage per second on touch; it closes its eyes and stops again only after 10 s with no player within 500.
- [ ] It spawns from player level 4 (weight 5), drops a 3 xp gem, and deals no damage at all while it sleeps.
- [ ] In a crowd of the other monsters, the Sleeper reads at a glance: a deep pink rounded square, asleep or not.
