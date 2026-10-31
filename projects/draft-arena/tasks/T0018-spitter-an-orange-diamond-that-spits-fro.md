---
id: T0018
title: "Spitter: an orange diamond that spits from a distance"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T03:51:35Z
claimed_at: 2026-10-31T04:27:32Z
epic: E2
designer: desktop
---

## Goal
The crowd gains a monster that makes you move: the Spitter holds its distance and spits globs, so standing still to farm gets punished, and kiting or closing in becomes a real choice.

## Details
A new monster, **Spitter**: "Keeps its distance and spits a glob that deals 6."
- Numbers: hp 20, speed 75 u/s, radius 13, contact damage 8 per second, xp 2, weight 5, fromLevel 5 (hp grows with the player's level as for every monster).
- Behavior (its own `think`, closest example the Zippy's): it plays a distance band of 160-280 units around the nearest player.
  - Closer than 160: it moves straight away from the player.
  - Farther than 280: it moves straight to the player.
  - In the band: it holds its ground, and if it has no glob in the air and at least 1.6 s have passed since its last glob, it winds up for 0.5 s, then fires one glob at the player's position.
- The glob: a new projectile — a small orange drop (a bubble), radius 7, speed 150 u/s, damage 6, flying straight by a path computed from its launch, gone when it hits something or after 1.6 s. A glob is not a target: you dodge it, you do not shoot it. At most 2 globs in the air per Spitter; at weight 5 a level-5 crowd holds about a fifth Spitters, so a full crowd of 60 puts at most about 40 globs around one player, all cheap path shots.
- Look: an orange diamond with an ink outline, a face of 2 eyes, mood calm, mouth a small "o" (its spit hole) when idle. The look warns before it acts: during the 0.5 s wind-up (synced in a slot, as the Zippy's) its mood turns to a frown and an orange glob is visible at its mouth.
- Reads in a crowd: an orange diamond is a shape no monster has (Dot a circle, Puff a pentagon, Zippy a triangle); the glob in flight is a small orange drop — no player weapon flies like it (player shots are cool stars), and it is far smaller than a Puff on the ground.
- What counters it: a sidestep (a glob flies at 150 u/s, the player moves at 210), closing in (it backs off inside 160 and its contact is a weak 8/s), and builds that hit a line — a Lance bolt through several of them, a Maw bite in front.
- What it punishes: standing still to farm or to hold a spot (a geyser, a gem line), and a tank that leans on standing in the crowd.
- 6 players and 60: it spawns in each player's own crowd (spawning is per player), so it behaves the same in both.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | part of the crowd that closes in on a player | the Dot only hurts on touch and never gives ground; the Spitter hurts at range and backs off when you close in |
| Zippy | a telegraph before it attacks | the Zippy dashes once and then is just a body again; the Spitter repeats its shot and keeps moving to stay in its band |
| Puff | a body in the crowd you clear | the Puff never attacks on its own and pops into Dots when it dies; the Spitter fires shots and survives intact |

## Acceptance criteria
- [ ] Around level-5 players, Spitters appear in the crowd alongside Dots, Zippies and Puffs, about a fifth of spawns (weight 5 vs the Dot's 10).
- [ ] A Spitter keeps its band: the player is inside 160 and it moves away; farther than 280 and it comes to the player; in the band it holds its ground.
- [ ] In the band it winds up 0.5 s (frown, an orange glob at its mouth) and then fires one glob (6 damage, 150 u/s, gone on hit or after 1.6 s), at most every 1.6 s, with at most 2 globs in the air per Spitter.
- [ ] A glob is a small orange drop in flight, clearly apart from the player's star shots and from monsters on the ground.
- [ ] Touching a Spitter deals 8 per second to the player; it dies for 20 hp (scaled by the player's level) and drops a 2-xp gem.
- [ ] Its face is calm when idle and changes before every shot, so a sidestep during the wind-up avoids the glob.
