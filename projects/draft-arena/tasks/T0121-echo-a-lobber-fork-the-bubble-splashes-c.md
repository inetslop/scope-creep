---
id: T0121
title: "Echo: a Lobber fork, the bubble splashes, comes back and splashes behind you"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T20:09:56Z
epic: E27
---

## Goal
The bubble's third direction: after its splash, the bubble turns and flies back toward you, splashing again where it stops behind you — a committed Lobber kites through a trail of their own ice, and every chase gets a price at the chaser's feet.

## Details
- **Echo rewrites your bubble's flight**, built the way Drift and Swoop rebuilt the bolt and Bop rebuilt the bubble: Lob's fire gives the bubble Echo when you have it. A player without Echo is unchanged.
  - **The out leg is exactly Lob's bubble today** — same range, same aim, same arc, the same normal splash where it lands (Lob's +2 splash damage per rank, Wide's size, Fuse and Fizz all apply to that splash as usual).
  - **The return leg:** where the bubble's splash strikes, the bubble turns in place over 0.2 s, then flies back **toward you** (homing to your current position) at **100 u/s for 1.0 s**, and splashes again where it stops. You outrun it (100 u/s against your 180+ move speed), so it lands behind you: a trailing zone every 1.1 s (Lob's own cooldown — Echo adds no extra shot).
  - **The return splash:** the same splash as your normal bubble — the same damage (Lob's ranks, your damage stats, Wide's size) but a smaller radius: **50% of your splash's radius at rank 1, +25% per rank** (rank 2: 75%, rank 3: 100%).
  - If you are knocked out before the bubble returns, it pops in a small puff and does not splash.
  - **Both splashes' strikes are your hits** (Chill, Reap, Swarm, Snare and the rest apply), and a return splash's kill is your kill (Chomp, Nest, Sting, Scavenge, Adrenaline and Fang pay out on it). Fizz lingers both splashes — a fizz-puddle where the out splash landed and one where the return splash lands.
  - **With Bop (T0118):** a bubble that touches a critter pops on it as a Bop bubble and does not return; a bubble that touches nothing splashes where it lands and still comes back. A Bop+Echo miss leaves a trail.
  - **Split:** every fanned bubble gets the return leg — each one splashes, comes back and splashes behind you, all 12% weaker.
  - **Quick flies the bubble faster on both legs**; Haste fires Lob sooner, as today. Lance (pierce) does nothing (the bubble hits nothing in flight, as today). Slush is its own straight shot and is untouched.
- **Look:** an Echo bubble wears a **thin teal band** around it in flight (the Lobber's color), as Bop's white band marks the bubbles that pop — a player sees at a glance which bubbles come back; on the return leg the band pulses. Where the bubble turns, a small white tick (a 4-unit pop, the fizz-tick style, no glow).
- **Talent line (Lobber tree, planning/modules/talents.md):** id `echo`, upgrade `echo`, max 3, needs `[["lob", 3]]` — the fork under Lob beside Wide and Bop: Wide grows the splash, Bop aims the bubble at the critter, Echo brings it back.
- **Text:** "Your bubble splashes, then turns and flies back to you, splashing again where it lands behind you. Per rank: the return splash is 25% bigger (50% to 75% to 100% of your splash)."
- **What it costs:** 3 points in a tree that has already spent Quick 1 and Lob 3 — a committed Lobber. Those 3 points could buy Wide (a bigger splash) or Bop (a bubble that snipes a critter); Echo is the choice to make the ground behind you as deadly as the ground ahead.

## Compared with what exists
Echo rewrites how the tree's shot flies, so one row for that kind (Drift, Swoop, Bop) and every similar upgrade named above:

| Existing | What it shares | What Echo does that it can't (not numbers) |
| --- | --- | --- |
| Drift | rewrites how the tree's shot flies | slows the bolt along its line and lets it linger; Echo's bubble flies out as normal and adds a second leg back to the thrower |
| Swoop | rewrites how the tree's shot flies | re-aims a bolt once at its target and flies a second leg at the enemy; Echo's second leg flies back to the thrower, away from the enemy |
| Bop | rewrites how the bubble flies | the bubble dies on the first critter it touches; Echo's bubble splashes on the ground and comes back, and with Bop a bubble that misses still returns |
| Wide | sizes your splash | makes the splash where the bubble lands bigger; Echo adds a second, smaller splash behind the thrower that Wide sizes too |
| Fizz | makes the Lobber's ground last | lingers the splash where it lands; Echo's splashes linger where they land, out and back (a fizz-puddle per splash) |
| Fuse | a reaction to your bubble's kills | pops a ring where a bubble killed; the return splash's kills fire Fuse, like the out splash's |
| Split | more, weaker shots for every weapon | fans out extra bubbles — with Echo, each of them splashes, comes back and splashes behind you |
| Slush | a Lobber shot that leaves a zone | a separate straight shot that leaves a slow puddle; Echo's zone is the bubble's own splash, behind the thrower, and it slows nothing |
| Goo | a shot that homes to an enemy | the drop turns and catches the nearest enemy, one way; Echo's bubble homes back to the thrower after it splashes |
| Cling | a shot that sticks to the target | the Goo rides the critter it hit; Echo's bubble rides the thrower, not the enemy |
| Scatter | a kill that spawns seekers | 4 mini-Goo from a Goo kill; Echo adds a leg to every bubble, on no kill |

## Acceptance criteria
- [ ] A player with Echo (Lob 3 or better): after a bubble's splash strikes, the bubble turns in place over 0.2 s and flies back toward the player at 100 u/s for 1.0 s, then splashes again where it stops — behind a running player.
- [ ] The return splash deals the normal splash damage at 50% of the splash's radius at rank 1, 75% at rank 2 and 100% at rank 3; a rank-3 Wide return splash is visibly bigger than one without Wide.
- [ ] A return splash's strike gets your on-hit upgrades (a critter standing in it is slowed by Chill), and a return splash's kill pays Chomp/Nest/Sting/Scavenge as your kill.
- [ ] A player with Fizz: both the out splash and the return splash leave a fizz-puddle where they land.
- [ ] With Bop: a bubble that touches a critter pops on it (the Bop burst) and does not return; a bubble that touches nothing splashes, comes back and splashes behind the player.
- [ ] With Split, every fanned bubble gets the return leg, all 12% weaker.
- [ ] A knocked-out player's returning bubble pops in a small puff and does not splash.
- [ ] An Echo bubble wears a thin teal band in flight (pulsing on the return leg); a normal bubble is unchanged. A small white tick where the bubble turns.
- [ ] Echo is in the Lobber tab as a 3-rank fork under Lob (needs Lob 3), beside Wide and Bop, with the text above.
