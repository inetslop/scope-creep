---
id: T0426
title: "The Gorge: the wave-90 boss that feeds on your leaks"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T14:32:01Z
---

## Goal
The next boss in the lane, wave 90: a big shape that walks the road and grows stronger every time the player lets something through — the first wave won by not leaking, not by melting faster.

## Details
- The wave-90 plan sends 2 Splinters, the Gorge 1.2 s behind (the Leech's line). The boss lane inherits everything through the bossId and the boss tag: the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, the escape horn.
- The feeding: while the Gorge lives, every enemy other than the Gorge that leaks makes the Gorge flash white and restore 15% of its max hp, with a thin red ring contracting in from 2 cells onto it (a new fx, the mend ring's shape in the Gorge's own color). At most 2 feedings (its 2 escorts). Never a revive: hp caps at max, and a killed Gorge stays dead. The Splinter's own leak still costs its life and breaks the kill combo as it does today — the feeding adds to it, never replaces it.
- The feeding is event-driven, not on a clock: nothing happens unless a leak happens, so the wave's decision is the player's — kill the fast Splinter before it crosses, or take the double sting (a life, and the Gorge 15% back).
- The first feeding teaches it once: a small white "leaks feed it" chip at the Gorge's spot (the leechTell pattern, the Leech's "drinks its escorts" line). The BossCard's hp row wears 2 muted pips, one fading per feeding used (the Mender's 4-pip line).
- Exact numbers: hp 720 (the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 90, spawnOnly, threat = the rest of the wave-90 budget after the Splinters' 1+1 (the Mender's rule).
- Look: a new silhouette — a thick rounded spiral (2.5 turns, open center), red (the warm family), size 0.5 (the boss norm). No enemy is a spiral; the red shapes in use are circle, square, diamond and hexagon.
- What counters it: early coverage of the road's start (the Splinter is faster than the Gorge and crosses in seconds) and burst on the Splinter before the Gorge matters; it punishes a focus-the-boss habit and every leak on its wave.

## Compared with what exists

| Existing | What it shares | What the Gorge does that it can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker | its leak costs a life and nothing else; on the Gorge's wave the player's leaks are its food |
| Block | `walk`, slow and tough | leaks for 2 lives; the Gorge leaks for 1, and it is fed by the leaks of the others |
| Colossus | `walk`, the whole wave in one shape | survives by going out of reach on a clock; the Gorge survives by being refilled when the defense fails |
| Guard | `walk`, a spawnOnly escort | carries the Titan's shield; the Gorge's escorts (Splinters) threaten to leak, and their leaks feed it |
| Titan | `walk`, a boss that halves damage | its survival is carried by another enemy standing beside it; the Gorge's is an event — a leak anywhere |
| Orb | `walk`, splits at half hp | answers pressure by adding bodies; the Gorge answers the player's leaks by adding its own hp |
| Hive | `walk`, pops a Dot every 6 s | grows the group on a clock; the Gorge grows itself, and only on the player's mistakes |
| Shard | `walk`, a fast split piece | a fragment of a killed enemy; the Gorge is the thing the wave's budget is mostly spent on |
| Sprinter | `walk`, ramps faster when hit | survives by outrunning the damage as it takes it; the Gorge takes every hit and just gets refilled |
| Splitter | `walk`, splits into two Splinters | makes more enemies when it dies; the Gorge spends its Splinters — their leaks are what feed it |
| Hauler | `walk`, a leak costs gold | its leak pays the player 5 gold; the Gorge's leak costs a life, and the leaks it witnesses pay it 15% |
| Mute | `walk`, holds the towers within 2 cells still | interacts with the towers; the Gorge interacts with the run's leaks |
| Flyer | `walk` (flies), crosses the board in a straight line | avoids the road entirely; the Gorge walks the road and uses whatever gets past the towers on it |
| Ward | `walk`, ignores control | survives by being untouchable to slow, root and gust; the Gorge takes every hit — its hp is just refilled |
| Leech | `walk`, a boss that drinks its escorts | drinks the escorts' hp on its own clock; the Gorge drinks the leaks — the player's failures, not the escorts' health |
| Mender | `walk`, a boss that restores hp | mends itself and its Wards on a clock, 4 times; the Gorge mends only itself, only when a leak happens, at most 2 times |
| Bulwark | `walk`, a plate across its front | survives by facing the wrong way; the Gorge survives by the player letting something through |
| Splinter | `walk`, fast and small | its leak costs a life; beside the Gorge it also feeds the Gorge 15% of max hp |

## Acceptance criteria
- [ ] Wave 90 sends 2 Splinters + the Gorge 1.2 s behind; the preview chip, arrival horn and ring, BossCard, death burst and name card, and escape horn all wear it through the boss lane.
- [ ] A Splinter leak while the Gorge lives: the normal leak (a life, the combo break) plus the Gorge flashing white, the thin red ring contracting onto it, and 15% of max hp restored, capped at max; after 2 feedings a third leak feeds nothing; a killed Gorge never revives from a later leak.
- [ ] The first feeding shows "leaks feed it" once at the Gorge's spot; the BossCard wears 2 pips, one fading per feeding.
- [ ] The spiral token is a new shape in red at size 0.5; no other token, sound or HUD element changes.
- [ ] Unit tests for the wave-90 plan and the feeding rule; content validation for the new field; the runChecks invariants (the Gorge's spawnOnly slot and the hp cap, the level.bossPlan's wave-90 case); `npm run check` and the desktop + mobile smoke pass.
