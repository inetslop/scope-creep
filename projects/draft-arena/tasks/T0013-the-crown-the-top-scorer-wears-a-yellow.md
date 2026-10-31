---
id: T0013
title: "The Crown: the top scorer wears a yellow crown"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T03:34:39Z
claimed_at: 2026-10-31T03:55:27Z
epic: E4
designer: desktop
---

## Goal
Players always know who is on top and who is the prize: the match's top scorer wears a yellow crown on its head and the crown moves as scores change, so the field shows who to fight and knocking out the crown becomes the match's big moment.

## Details
- A new director, one file in src/content/directors/ next to gem-rain.ts. When: the whole match, checked every tick and after each player death. Where: on the leader, wherever they are. What it adds: one crown marker, and one ring per crown move.
- Leader: the living player or bot with the highest score. No crown while every score is 0; the first score takes it. The crown moves only when someone scores strictly higher than the current leader — a tie never moves it (it must not ping-pong between two equal scores).
- Look: a small yellow candy crown, 3 points, ink outline, about 26 units wide, shown on the leader's critter about 12 units above its head. It is an on-critter decoration (rendered the way a status marker or an accessory renders on a critter) so it follows the leader automatically and always faces up. It never changes the critter's face, size or hitbox.
- When the crown moves: the yellow ring from the level-up effect spreads from the new leader.
- It is a field marker, not a HUD element: no new card and no change to the scoreboard (the scoreboard keeps showing scores; the crown answers "where is the leader" on the field). No new input, no sound. Bots can wear it.
- With 6 players (mostly bots): the crown sits on a player or a bot and hunting it is the main fight. With 60: scores churn, and the strict-overtake rule keeps the crown from flickering between tied players.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a director that runs the whole match and marks something on the field | drops and spawns nothing: it changes who players target by marking the top scorer, instead of adding loot |

## Acceptance criteria
- [ ] In a running match, the highest-scoring critter has a yellow 3-point crown floating above its head and nobody else does; in a fresh match where all scores are 0, no crown.
- [ ] A player who scores strictly higher than the leader gets the crown, with the yellow ring on them; a player who only ties the leader's score never takes it.
- [ ] When the crowned critter is knocked out, the crown appears on the next-highest scorer.
- [ ] A bot can wear the crown; the crown never changes a critter's face, size or hitbox.
- [ ] The HUD is unchanged: no new card and no new line in any existing card.
