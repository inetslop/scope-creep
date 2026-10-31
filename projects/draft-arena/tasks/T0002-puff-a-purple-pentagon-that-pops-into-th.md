---
id: T0002
title: "Puff: a purple pentagon that pops into three Dots"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T01:44:04Z
epic: E2
---

## Goal
A slow, tanky monster that pops into three Dots when it dies: killing it becomes a decision — take it down at range, or eat a burst of extra threats — so players learn to manage the space around a kill. A new way to survive (splitting on death) that no monster has.

## Details
- New monster file `src/content/monsters/puff.ts` (closest example: `src/content/monsters/dot.ts`, same data shape; the Puff adds one `onDeath`).
- Numbers: hp 45, speed 50 (players move at 210), radius 22 (a Dot's is 14), damage 14 per second while touching a player, xp 4, weight 4 (a Dot's is 10), fromLevel 3. Its hp grows with the level of the player it spawned around, like every monster.
- Behavior: moves like a Dot — straight for the nearest player, fanned out a little. On death it pops into three Dots that spawn at its spot, in a small burst, each facing a different way. Its gem drops as usual, worth its xp (4).
- Crowd count: three Dots per Puff death; with weight 4 against the Dot's 10 the Puff is a minority of the crowd, so splits add at most a handful of monsters per second around a player.
- Look: shape pentagon, color purple, face: mood calm, 1 eye, mouth o. It looks the same at all times — the shape itself is the warning (players learn: purple pentagon pops into three Dots). On death: a purple confetti burst (the pop effect), and the three Dots (the existing red circle, angry face) burst out.
- What counters it: take it down at range — kite it (speed 50 is far below a player's 210) or kill it in open space. What it punishes: a player who kites one into a monster crowd, or who camps one spot while a Puff drifts over.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | A Dot never spawns anything; the Puff pops into three Dots on death, so killing it is a decision about the space around the kill |

## Acceptance criteria
- [ ] From player level 3, roughly 1 in 3 spawned monsters is a big purple pentagon (weight 4 vs the Dot's 10); below level 3, none.
- [ ] The Puff chases a player like a Dot but slowly (50 u/s) and does 14 damage per second while touching.
- [ ] When the Puff dies, a purple confetti burst pops, three Dots burst out of its spot, and its gem (worth 4 xp) drops.
- [ ] A player who runs (210 u/s) always escapes the three Dots; a player who stands still is caught by them.
- [ ] A Puff death adds three to the per-player crowd; the cap of 60 monsters around a player still holds.
