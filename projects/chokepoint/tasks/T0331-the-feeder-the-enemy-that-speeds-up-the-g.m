---
id: T0331
title: The Feeder: the enemy that speeds up the group around it (the T0309 re-file)
size: M
priority: 2
status: design
depends_on: []
---

## Goal
A new enemy that walks slow and makes the group around it fast: while any enemy is within 2 cells of a Feeder, that enemy walks 25% faster. From wave 13 on, a wave is a pace, not just a size.

## Details
- Numbers (wave 1, waves scale hp): hp 90, speed 0.9 cells/s (Block's crawl), gold 8, livesCost 1, threat 2, fromWave 13.
- The mix: one Feeder on waves 13, 17, 21, 25, 29, … (every fourth from 13) — deterministic in the wave plan like the other mixes; boss waves take the whole wave and are skipped (20, 30, 40 fall outside the sequence).
- The aura, the new mechanic: every enemy whose center is within 2 cells of a living Feeder walks 25% faster while inside — multiplied onto its current speed, after its own speed (a Sprinter's ramp) and tower slows (a Frost) have applied, so the Feeder's +25% is last. One Feeder's aura at a time: two Feeders still speed an enemy by 25%, not 50%. The aura is per-frame: it ends the moment the Feeder dies or the enemy leaves the 2 cells.
- Look: an orange bullseye — a circle with a flat ring around its body (no enemy wears a ring around its body today), size 0.24. While it lives, a quiet thin orange ring under it sweeps out to its full 2 cells and fades, once per second — the Mute's silence-ring language (T0219), enemy-side; a new enemy-hook file draws it (the Dasher streak's file is the closest example).
- The Ward ignores controls; the Feeder does not — a Push gust, an Anchor root and a Frost slow all take on it, holding the group's pace in place. The aura is a buff, not a control: a Ward inside the ring is sped up like everything else.
- Counters it: it is plain prey with no defense of its own — kill it before it paces the group, and a control on it freezes the pace it gives away. It punishes a build that only covers the road's end (the group arrives early) and tight waves (every 8th from wave 6), which it turns into fast ones.
- Its death is an ordinary kill (gold, Mint, combo, the "stopped" beat); the new-enemy name tag (T0085), the next-wave preview and the enemies reference pick it up with no change to them.
- It lands the regular-enemy cap at 10 of 10 (modules/enemies.md); no removal or merge is needed.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk` | walks on its own pace; the Feeder changes the pace of every enemy around it |
| Block | `walk`, slow and tough | soaks damage for itself; the Feeder spends its slowness on the group's pace |
| Colossus | `walk`, the boss whole-wave | stands still in reach and out-of-reach phases; the Feeder's effect reaches other enemies |
| Guard | `walk`, the Titan's escort | carries the Titan's shield (its own defense); the Feeder has no defense and gives the group a buff |
| Titan | `walk`, a boss wall | halved while its Guard lives (its own defense); the Feeder's ring changes neighbours, not itself |
| Orb | `walk`, splits at half health | replaces itself with two Shards on a one-time death event; the Feeder acts continuously while it lives |
| Shard | `walk`, fast debris | a fast walker in its own right; the Feeder is slow and makes others fast |
| Sprinter | `walk`, gets faster | ramps its own speed when it is hit; the Feeder speeds the enemies around it without being hit, and it does not speed itself |
| Splitter | `walk`, splits on death | replaces itself with two Splinters on death; the Feeder's aura runs every frame while it lives |
| Hauler | `walk`, an enemy hook | its hook reacts to its own leak (a gold cost at the exit); the Feeder's hook acts on other enemies every frame |
| Mute | `walk`, an enemy hook, a 2-cell aura | holds towers still within 2 cells; the Feeder speeds up enemies within 2 cells |
| Ward | `walk`, ignores controls | its immunity is to slow, root and gust for itself; the Feeder is fully controllable and its ring is a buff, not an immunity |
| Bulwark | `walk`, a plate | halves shots into its own face; the Feeder's ring changes neighbours' speed, and it has no defense |
| Splinter | `walk`, fast debris | a fast walker in its own right; the Feeder is slow and makes others fast |

## Acceptance criteria
- [ ] From wave 13, waves 13, 17, 21, 25, … carry one Feeder (a unit test on the wave plan: wave 12 has none, wave 13 has one, boss waves 20 and 30 have none).
- [ ] An enemy inside a living Feeder's 2 cells walks 25% faster (a unit test: a Dot's effective speed with the aura, with a Sprinter's ramp and a Frost slow applied — the Feeder's +25% is last); outside the 2 cells, or the moment the Feeder dies, it reverts.
- [ ] Two Feeders still speed an enemy by 25%, not 50% (a unit test).
- [ ] A Ward inside the ring is sped up (the aura is not a control); a Push gust, an Anchor root or a Frost slow on the Feeder takes effect (it is not immune).
- [ ] The orange bullseye token and the once-per-second 2-cell ring show on the board, in the next-wave preview and in the enemies reference; the new-enemy name tag names it on first appearance.
- [ ] The regular-enemy count lands at 10 of the 10 cap (a content test).
