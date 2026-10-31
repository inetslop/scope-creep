---
id: T0020
title: "Flee: a red teardrop that runs from the nearest player"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T04:17:26Z
claimed_at: 2026-10-31T04:49:25Z
epic: E2
designer: cachyos-x8664
---

## Goal
A monster that runs from you: a chase across the field that punishes builds that stand still, and rewards the ones that move.

## Details
- Look: a small red teardrop, pointed in the direction it runs, with a scared face (2 eyes, o mouth). It reads at a glance: the red critter with wide eyes that is always running away.
- Numbers: hp 10, radius 11, damage 8 per second while touching a player, xp 2 (a normal gem on death), weight 5, fromLevel 3. Speed: 80 u/s while it wanders, 160 u/s while it panics.
- Behavior (its own `think`):
  - Nearest player more than 300 away: it wanders — a short hop in a random direction, re-picked every 1.2 s, at 80 u/s. Face: calm scare, half-lidded eyes, small o mouth.
  - Nearest player within 300: it panics — the face changes first (eyes go wide, the body jitters a little), then it runs directly away from the player at 160 u/s, wobbling ±25° around the escape direction, re-picked every 0.3 s, so a crowd does not run in a single line. The escape line is open, so a player always sees where it is going.
- It spawns nothing and fires nothing. A Flee more than 1100 from everyone relocates ahead of a player like the rest of the monsters: it comes back to be chased.
- What it punishes and rewards: a build that camps in a crowd (a Maw farmer, a pure-splash Lobber) cannot touch a Flee that keeps running — its 2 xp only come to players who chase. It rewards Swift, fast Bolts, and the Split fan, the wide spray that hits a wobbler.
- With 6 players and with 60: weight 5 is about one Flee in every six monsters from level 3 up, whatever the player count; with 60 players the relocations keep fleers near someone.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | a small warm critter in a player's crowd | runs away from the nearest player instead of closing in: the player chases it across the field, it never comes to the player |
| Puff | spawns from level 3 and drops a gem worth more than a Dot's | wanders and flees with a face that warns before it moves; it pops into nothing when it dies |
| Zippy | makes a player move around a monster crowd | a sustained wobbly sprint in an open line a player can follow, not a one-shot dash along a fixed lane; it never stops to wind up |

## Acceptance criteria
- [ ] From a level 3 player's field up, a Flee appears about once every six monsters, as a small red teardrop with a scared face.
- [ ] Left alone more than 300 from every player it wanders at 80 u/s; when a player comes within 300 its eyes go wide and it runs directly away at 160 u/s with a visible wobble.
- [ ] A plain player (210 u/s) can catch it; on contact it deals 8 hp/s; on death it pops into confetti and drops its 2 xp gem.
- [ ] A Flee more than 1100 from every player relocates ahead of a player again.
- [ ] It adds only itself to the crowd: it spawns no monsters and fires no shots.
