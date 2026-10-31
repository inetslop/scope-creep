---
id: T0037
title: "Boing: a deep red heart that crouches and leaps at where you are going"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T07:27:49Z
epic: E9
---

## Goal
The 7th monster: a leaper that closes on a straight-line kiter, so running in a straight line (the Gunner loop) stops being a safe answer and a hard direction change becomes the dodge.

## Details
- Look: a deep red heart (darker than the Dot's red), plump, with an ink outline. Face: mood calm, 2 eyes, mouth a smile. In the 0.3 s before each leap it squashes to 60% of its height, mood angry, mouth teeth — the only warning before it moves.
- Movement (its new behavior: it leaps, it never walks all the way to you): a cycle of crawl 0.2 s at 50 u/s toward the nearest player, crouch 0.3 s (stationary, the angry squash), a leap (a fixed straight line at 450 u/s to its landing spot, up to ~0.6 s), a landing squash 0.15 s, then the cycle repeats. At the start of the leap it picks its landing spot: the target player's position plus 0.4 s of the player's current velocity (where they are going), capped at 260 units from the Boing. Once leaping, its line is fixed until it lands; when the gap is small the landing spot is past the player, so it leaps across them and crawls back.
- Numbers: hp 16, speed 50 (crawl), radius 15, damage 16 per second while touching, xp 3, weight 5, fromLevel 6. It spawns nothing and fires nothing: at most one monster per Boing.
- How it plays: a player running straight at 210 u/s without sidestepping is caught by one Boing within about 5 s, because each cycle's leap lands ahead of where they are and crosses their path. A player who keeps reversing direction shakes it: each leap commits to where they were going, and a reversal puts them off that line for a full cycle. Standing still is punished: every cycle's landing spot is the player. One leap in flight can still be sidestepped by a quick perpendicular move.
- What it punishes: straight-line kiting with a self-aiming weapon (the Gunner loop); a crowd of Boings covers the turns so no single reversal saves you. What counters it: a hard direction change, or a burst build that kills it in the 0.2 s crawl (it is fragile: 16 hp).
- Readable in a crowd: a heart in deep red matches no existing shape or color (the Dot is a small light-red circle, the Zippy a pink triangle), and the crouch-then-leap rhythm is the only one on the field.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | a crowd that chases the nearest player | a Dot glides and never lets go no matter how you run; a Boing commits to a landing spot and re-aims slowly, so a straight run is a losing answer but a reversal is a winning one |
| Zippy | a committed straight dash after a wind-up | a Zippy dashes once along a lane fixed during a long wind-up and misses a sidestep; a Boing re-aims every cycle and predicts where the player is going, so it closes on a fleeing player instead of missing them |
| Spitter | an engagement at a range | a Spitter holds its distance and spits; a Boing is a closer that leaps onto the player and can land past them |
| Puff | a monster that pops into smaller monsters | a Puff's split happens on death and makes weaker, different monsters; a Boing never splits — its threat is the rhythm of its leaps |
| Snail | a slow orange mover | a Snail marks the ground and the ground slows you; a Boing marks nothing — it only arrives in bursts |

## Acceptance criteria
- [ ] A deep red heart monster with the face above spawns around level-6+ players (weight 5, fromLevel 6); killing one drops a gem worth 3 xp and plays the normal death pop.
- [ ] The cycle is visible: a slow 0.2 s crawl, a 0.3 s crouch with the angry face, a fixed straight-line leap at 450 u/s, a landing squash; the landing spot is where the player is going (their position plus 0.4 s of their velocity, capped at 260 units).
- [ ] A player who runs straight at 210 u/s without sidestepping is caught by one Boing within about 5 s; a player who keeps reversing direction shakes it, its leaps landing off their new heading.
- [ ] While touching a player it deals 16 damage per second; its hp is 16 and its radius 15, so a burst build can kill it in one volley during the crawl.
- [ ] It spawns nothing and fires nothing: the field gains at most one monster per Boing.
- [ ] In a crowd it reads at a glance: a deep red heart, distinct from every existing shape and color, with a visible crouch before every leap.
