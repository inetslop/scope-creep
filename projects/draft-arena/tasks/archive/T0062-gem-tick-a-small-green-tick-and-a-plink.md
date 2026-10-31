---
id: T0062
title: "Gem tick: a small green tick and a plink where a gem is picked up"
size: S
priority: 3
status: failed
depends_on: []
attempts: 0
created: 2026-10-31T11:40:36Z
claimed_at: 2026-10-31T11:52:16Z
finished_at: 2026-10-31T12:24:26Z
design_attempts: 1
---

## Goal
The farm loop is the quietest moment of a match: every gem you pick up ticks where it vanished and plinks, so a life of gems feels collected, and a big jackpot gem is told apart by ear.

## Details
- A new effect file in src/content/effects/ (closest example: coin — "a candy coin pops where a kill happened and rises ~30 units while fading"): a `gem-tick` — three small green stars tick up ~14 units from the pickup's spot and fade over 0.25 s. Candy stars, reward green, ink outlines, no glow.
- The three gem pickups play it when a player collects them: the normal gem, the event gem and the jackpot (closest example: the coin pickup's pop, and how T0041's coin tick keys to it).
- A sound in the audio layer (closest example: the coin tick of T0041): a `gemPlink(seed, age)` — a short high plink (a ~1400 Hz sine, 0.07 s, peak ~0.05), deduped per effect seed like the other sounds, quiet enough to sit under the pops.
- When several of your ticks land at once (a gem-rain grab), roll them: one plink every 30 ms, at most six, exactly like the coin roll.
- The jackpot's tick plays the same effect but one lower, longer plink (~800 Hz, 0.14 s, peak ~0.06).
- The tick shows on every player's pickup (so the field shows who is farming); the plink plays only for your own pickups, so 60 players farming never stacks the sound.

## Acceptance criteria
- [ ] Picking up a monster gem plays a small green star tick where the gem was, with a short high plink for the picker.
- [ ] Picking up the jackpot gem plays the same tick with the lower, longer plink.
- [ ] Grabbing four or more gems at once (gem rain) rolls at most six plinks at 30 ms apart instead of a burst of them.
- [ ] Bots picking up gems show the tick but play no sound.
- [ ] A gem the player does not collect (it expires or another takes it) plays nothing.

## Rejected by architect (yoga)

the plink "only for your own pickups" has no per-player channel in the frozen engine to key on: effects carry no owner (WireEffect is just kind, ax, ay, bx, by, value, and effect draw() runs on every client that receives it, so a draw-based gemPlink(seed, age) sounds on bot/other players' pickups within EVENT_RADIUS too — failing "bots show the tick but play no sound" and "plink only for your own pickups"), there is no per-player pickup message in the protocol (S2C: welcome/snapshot/roster/scores/reject only), and no `view.me` field changes only when *you* collect a gem (xp also rises on the crown kill bounty, mark and gem-rush claims, and cannot carry the jackpot's lower/longer variant or the gem count needed for the 6-at-30 ms roll — unlike T0041's coin tick, which keys on `view.me.coins`, a per-player field that has no gem analogue); it needs an engine change: a per-player pickup event on the wire (or a per-player owner on effects).
