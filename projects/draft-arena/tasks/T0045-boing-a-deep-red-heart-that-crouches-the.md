---
id: T0045
title: "Boing: a deep red heart that crouches, then leaps to where you're going"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T08:32:32Z
epic: E9
---

## Goal
The crowd gains a 7th monster with a move no other has: a melee critter that leaps to a *predicted* spot, so a straight-line kite no longer escapes it.

## Details
- Name: Boing. Description (one line): "Crouches, then leaps to where you're going."
- A squishy deep red heart, ink outline, angry face (2 eyes, a frown). It rests with a slow bob, watching the nearest player.
- When the nearest player is within 180 units it crouches: it squashes flat to half its height and its mouth opens to teeth for 0.6 s. This is the telegraph — the moment to answer by moving.
- Then it leaps in a straight line to where the player *will be*: the player's position plus the player's heading × 0.4 s. The leap is a stretched heart at 320 u/s, for at most 0.5 s (about 160 units), then it lands.
- It deals 14 damage per second while touching a player, in the air or on the ground.
- After each leap it sits (can't leap) for 0.9 s, then can crouch and leap again if a player is still within 180 units. When far, it shuffles toward the player at 40 u/s to close in.
- Exact numbers: hp 24, speed 40, radius 14, damage 14 (per second touching), xp 3, weight 5, fromLevel 5.
- What it punishes: a straight-line kite — running in a line at constant speed lets it land on you. What counters it: a hard direction change (jinking) during its 0.6 s crouch makes it leap past your old line; zoners can hit the crouching, telegraphed Boing before it leaps.
- Crowd count: it adds only itself (no spawns, no projectiles), so +1 to the crowd of up to 60 around each player.
- It reads at a glance: the only heart-shaped monster, in deep red (darker than the Dot/Flee red); the flat crouch and teeth mouth are the "about to leap" warning.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | Dot never stops or telegraphs — it just walks. The Boing rests, then commits to one fast leap at a *predicted* spot. |
| Zippy | winds up, then makes one fast committed movement | Zippy dashes along its own fixed lane (where it was pointing). The Boing leaps to where the *player is going* (a moving target), so it lands on you where you're heading, not just along your lane. |
| Sleeper | a stationary warning state, then closing on the nearest player with touch damage | The Sleeper wakes and then just chases (keeps walking at you). The Boing does not chase — it takes one big leap to a predicted point and then sits, so it is dodged by a sharp turn, not by outspeeding it. |

## Acceptance criteria
- [ ] A deep red heart (heart shape, 2 eyes, frown) spawns from player level 5, distinct in shape and color from every other monster.
- [ ] When a player is within 180 units it squashes flat and shows teeth for 0.6 s, then leaps in a straight line toward the player's predicted position (position + heading × 0.4 s) at 320 u/s for at most 0.5 s.
- [ ] Running in a straight line at constant speed lets a Boing land on you; a hard direction change during its 0.6 s crouch makes it leap past your old line.
- [ ] It deals 14 damage per second while touching a player, and after each leap it sits 0.9 s before it can leap again.
- [ ] It adds only itself to the crowd (no spawns, no projectiles) and drops a gem worth 3 xp when it dies.
