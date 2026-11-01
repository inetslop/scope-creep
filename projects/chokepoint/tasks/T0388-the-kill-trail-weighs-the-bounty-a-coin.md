---
id: T0388
title: "The kill trail weighs the bounty: a coin per 10 gold"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T23:16:36Z
claimed_at: 2026-11-01T23:29:00Z
designer: yoga
---

## Goal
The kill-gold trail (T0061) slides exactly one small coin per kill today, whatever the kill pays — a Hauler's "small fortune" (10 gold) and a boss's 20 fly the board exactly like a Dot's 4. A bigger bounty slides more coins, so what a kill pays is felt in the money that flies to the stats card.

## Details
- The trail launches extra coins for a big bounty, counted from the enemy's own bounty (its data gold, before the quiet wave's double, the last stand's double and Lean's thinning — those never add coins): a kill whose bounty is 10 or more (Hauler, Block, Ward, Bulwark, the 12-gold Shard) slides one extra coin; a kill whose bounty is 20 or more (the bosses: Colossus, Titan, Orb, Hive) slides two extra, so a boss kill's trail is a three-coin train.
- The extra coins are the trail's own coin (the HUD's ~10 px coin, T0061's look) on the trail's own arc to the gold number, each staggered ~80 ms behind the one before; a sub-10-gold kill slides exactly the one coin it does today, byte-identical.
- One new enemy-hook file in the comboBreak pattern (`src/systems/enemyHooks/comboBreak.ts`, T0207), registered in the enemy hooks' index, reacting to a kill: it triggers the extra launches through the trail's own launch (if that launch is private to the trail's owner, one small shared helper there is the only other edit).
- Visual only: the kill gold, the gold pop, the chip burst, the boss's own death moment (burst, name card, horn) and the first coin's arc and timing are all untouched; no HUD, no key, no sound.

## Acceptance criteria
- [ ] A kill of a 10-gold enemy (a Hauler, a Block, a Ward, a Bulwark, a Shard) slides exactly two coins on the trail — the existing one plus one new one, ~80 ms behind it, same arc and look; a kill under 10 gold (Dot, Sprinter, Splinter, Dasher, Flyer, Guard) slides exactly one coin, byte-identical to today.
- [ ] A boss kill (Colossus, Titan, Orb, Hive: 20 gold) slides exactly three coins; the boss's death burst, name card and horn are unchanged.
- [ ] The kill gold paid, the gold pop and its number, the chip burst, and the trail's first coin (arc, look, timing) are byte-identical to before; quiet's double, the last stand's double and Lean's thinning never change the coin count; no new HUD, key or sound.
- [ ] The game is playable menu to game over on desktop and mobile.
