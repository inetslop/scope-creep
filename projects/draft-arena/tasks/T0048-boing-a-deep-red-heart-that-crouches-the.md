---
id: T0048
title: "Boing: a deep red heart that crouches, then leaps to where you're going"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T09:20:00Z
claimed_at: 2026-10-31T09:45:13Z
epic: E9
designer: inet-racing
---

## Goal
The crowd gains a 7th monster with a move no other has: a melee critter that leaps to a *predicted* spot, so a straight-line kite no longer escapes it. (Rebuild of T0045, rejected only for missing rows in the comparison table — this one carries the full table.)

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
- It reads at a glance: the only heart-shaped monster, in deep red (darker than the Dot/Flee red); the flat crouch and the teeth mouth are the "about to leap" warning.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player with touch damage | The Dot never stops, telegraphs or commits — it just walks. The Boing rests, telegraphs a crouch, then makes one fast leap at a *predicted* point and sits. |
| Puff | chases the nearest player with touch damage, the same walk as a Dot | The Puff only walks at you (slow, tanky, pops into Dots). The Boing never chases — it shuffles to close in, then telegraphs and leaps to where you are going. |
| Flee | touch damage on a player it touches | The Flee only runs away from you. The Boing closes in on you: it shuffles nearer and leaps toward your predicted position. |
| Zippy | a telegraphed wind-up, then one fast committed movement | The Zippy dashes along its own fixed lane — where it was pointing — and cannot bend. The Boing aims at the player's *future* position (position plus heading), so it lands on a moving target, not a lane, and a hard turn during its crouch sends it past you. |
| Sleeper | a stationary warning state, then closing on the nearest player with touch damage | The Sleeper wakes and then keeps chasing (continuous walking at you). The Boing does not chase — it takes one big leap to a predicted point and then sits, so it is dodged by a sharp turn, not by outspeeding it. |
| Snail | chases the nearest player like a Dot, with touch damage | The Snail never leaves the ground and never commits to one fast move — its threat is the sticky patch it lays, not a leap. The Boing is all about the leap. |
| Spitter | holds its own movement around the nearest player and attacks it | The Spitter keeps a distance band and spits a glob from range; it never closes in. The Boing is a pure melee leaper: it shuffles to close to 180 and only then acts. |

## Acceptance criteria
- [ ] A deep red heart (heart shape, 2 eyes, frown) spawns from player level 5, distinct in shape and color from every other monster.
- [ ] When a player is within 180 units it squashes flat and shows teeth for 0.6 s, then leaps in a straight line toward the player's predicted position (position + heading × 0.4 s) at 320 u/s for at most 0.5 s.
- [ ] Running in a straight line at constant speed lets a Boing land on you; a hard direction change during its 0.6 s crouch makes it leap past your old line.
- [ ] It deals 14 damage per second while touching a player, and after each leap it sits 0.9 s before it can leap again.
- [ ] It adds only itself to the crowd (no spawns, no projectiles) and drops a gem worth 3 xp when it dies.
