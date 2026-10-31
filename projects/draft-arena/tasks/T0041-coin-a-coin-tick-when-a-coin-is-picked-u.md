---
id: T0041
title: "Coin: a coin tick when a coin is picked up or spent"
size: S
priority: 2
status: design
depends_on: [T0039]
attempts: 0
created: 2026-10-31T07:44:39Z
epic: E11
---

## Goal
Coins are what you play for across matches, and right now they are silent. Give the coin a short bright tick, so earning it in the match and spending it in the shop both feel like something happened.

## Details
- A short bright "tick" (a small coin clink, under about 0.12 s) plays in two places:
  - In the match, the moment a coin lands on the player (a kill coin or an event coin being collected).
  - In the shop, the moment a buy succeeds and the price leaves the balance.
- One tick per coin event. Collecting several coins at once plays a quick little roll of ticks (staggered by a few milliseconds each), not one loud tick and not a buzz.
- Bright and small, pitched so it is its own thing, distinct from both the monster pop and the level-up chime.
- Uses the same audio layer the Pop set up (T0039). This task adds only the tick and hooks it to the moment a coin is collected in the match and to a successful shop buy.
- No engine change; works on desktop and mobile. In the shop, the buy tap is itself a user gesture, so the audio layer can start there on a phone even before the first match.

## Acceptance criteria
- [ ] Kill a monster that drops a coin and collect it: one coin tick the moment it lands on the player.
- [ ] In the shop, buy an item you can afford: one coin tick the moment the price is taken from the balance.
- [ ] Collect several coins at once: a quick roll of ticks, clean, no buzz.
- [ ] The tick sounds distinct from both the monster pop and the level-up chime.
- [ ] On a phone both hooks play without blocking the controls.
