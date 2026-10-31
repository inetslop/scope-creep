---
id: T0030
title: "Goober tree: a homing Goo that finds the nearest enemy for you"
size: L
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T05:50:41Z
claimed_at: 2026-10-31T05:50:45Z
epic: E8
designer: desktop
---

## Goal
A fourth playstyle for the draft: a build whose weapon aims for you. Gunner kites with straight Bolts, Lobber zones with arcing bubbles, Body bites in front — the Goober walks into the crowd while its big blue drop turns in flight and catches whatever is nearest.

## Details
The tree (one file in src/content/talents/, listed in TREES; the closest example: the Lobber tree, T0003). Talents, in file order:
- The tree: name Goober, description "Your Goo: a drop that turns and finds the nearest enemy for you.", look: shape circle, color blue.
- Reap: max 3, no needs. On-hit. "Hits on an enemy below half its hp deal +6 damage, per rank." look: shape diamond, color blue.
- Goo: max 3, needs Reap 1. A weapon. "Every 1.6 s, lobs a big blue drop at the nearest enemy within 260; it turns in flight to catch it, or plops straight with none in range. 18 damage, 110 u/s, 2.5 s. Each rank: +6 damage." look: shape circle, color blue.
- Gush: max 3, needs Goo 1. On-kill. "When a Goo kills, a puddle marks the spot: 40 units around it, 20% slower for 1.5 s, refreshed while in it. Each rank: +10 radius." look: shape hexagon, color teal.
- Scatter: max 1, needs Goo 3. On-kill capstone. "When a Goo kills, it pops into 4 mini-Goo that home to the 4 nearest enemies: 4 damage, 200 u/s, 1 s. Mini-Goo do not pop again." look: shape pentagon, color blue.

The tree as the panel will draw it:
```
Reap (3)
  Goo (3, needs Reap 1)
    Gush (3, needs Goo 1)
    Scatter (1, needs Goo 3)
```

- The Goo (a new projectile file; the closest example: the glob — a drop; the Goo turns, so it is a step() shot sent every tick): a big blue drop, 14 radius, wobbling as it turns so it reads "chasing" at a glance — a drop, not a star, and blue, not the Bolt's yellow. It aims at the nearest enemy within 260 and turns toward it while flying; with none in range it plops straight ahead. At most 2 Goo per player alive at once (1.6 s fire, 2.5 s life), 6 with Split 2, plus at most 24 mini-Goo from Scatter; mini-Goo are small blue drops (8 radius) and never trigger Gush or Scatter.
- The Goo is a weapon, so the mods say what they do to it: Haste (fires sooner), Quick (flies faster), Might (+12% damage), Split (a fan of Goo that each home on their own, 12% weaker each) and Chill (its hits slow) apply; Lance's pierce applies because the Goo is a projectile (a Goober build that also put points in Gunner gets a piercing Goo — a fair cross-tree combine); Ricochet (a bolt bounce), Wide (the bubble's splash) and Fuse (the bubble's kill) do not.
- Reap works with every weapon: a Bolt that lands on a half-dead enemy deals +6 (finish what you wounded before the next volley); the bubble's splash strike deals +6 to anything inside below half hp; the Maw's bite deals +6 to a half-dead enemy in front; the Goo deals +6 to the half-dead target it catches. On a half-dead player it is the same +6.
- Gush's puddle is a new area (the closest example: the Snail's sticky patch) and a new status (the closest example: Mired): 20% slower, 1.5 s, refreshed while inside — distinct from the ice splash (which damages) and the sticky muck (which mires at 60%). It slows players in it too, so a kiting rival running through your puddles pays for it.
- The capstone Scatter pays out the whole build: a full Goober build's kill makes a puddle (Gush) and sends 4 seekers after the next targets (Scatter), so standing in a crowd scatters your damage.
- What it costs: the full build is 10 of the about 16 points a life gives (level 2 to 17) — a Goober player gives up the Bolt rank-5 kiting or the Chomp tanking those points would otherwise buy, and before Goo 3 the build is only a finisher mod and a slow weapon.

## Compared with what exists
Trees (one row per tree):
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gunner | a self-firing ranged weapon, cheap mod first | its weapon re-aims in flight: you walk and the Goo hunts the nearest thing (the Bolt flies straight and misses what moves) |
| Body | a payoff for standing in a crowd | the Goo is ranged and multi-target: it reaches 260 and Scatter seeks 4 targets at once (the Maw bites in front, up close; Chomp heals the killer) |
| Lobber | a slow shot with a payoff where it ends | the Goo hits the target it catches on the way, and it turns (the bubble never hits in flight and its arc is fixed) |

Upgrades (weapons, on-hit, on-kill):
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a self-firing weapon at the nearest enemy | the Goo turns in flight to catch a moving target and lands one heavy hit, not a straight volley |
| Maw | a self-firing weapon on a short cooldown | the Goo is a projectile that reaches 260 (the Maw bites only what is in front, up close) |
| Lob | a slow weapon whose shot does its thing where it ends | the Goo hits its target in flight (the bubble only where it lands) and it turns (the arc is fixed) |
| Chill | an on-hit effect on the target | Reap deals extra damage on a condition — the target below half hp — instead of a status |
| Ricochet | an on-hit that changes the shot's path | Reap changes the damage, not the path; it works on the first hit, not the bounce |
| Chomp | an on-kill that pays the killer | Gush and Scatter pay at the kill spot (a puddle, 4 seekers), not to the killer's body |
| Fuse | a kill pops into a ring where the victim died | the Gush puddle slows what walks in (the ring damages what is inside), and Scatter sends seekers after 4 other targets (a ring only hits what is in it) |

## Acceptance criteria
- [ ] The talents panel has a Goober tab: Reap, Goo, Gush and Scatter drawn as the tree above, with what is still needed written on locked talents.
- [ ] A player with Goo 1 fires a big blue drop every 1.6 s that turns toward the nearest enemy within 260 and deals 18 damage (24 at rank 2, 30 at rank 3); with no enemy in range it flies straight and vanishes after 2.5 s.
- [ ] Reap: a hit on an enemy below half its hp deals +6 damage per rank, on every weapon including player targets.
- [ ] Gush 1: a Goo kill leaves a 40-unit puddle that slows what is inside by 20% for 1.5 s (50 and 60 units at ranks 2 and 3); a player standing in it slows too.
- [ ] Scatter with Goo 3: a Goo kill pops 4 small blue drops that each chase a different nearby enemy for 1 s; mini-Goo never pop again and at most 24 are alive per player.
- [ ] Split on the Goo fans out and each Goo homes on its own; Lance makes the Goo pierce; Wide and Fuse do nothing to it.
- [ ] The Goo, mini-Goo and puddle read in a crowd at a glance — a big blue drop, small blue drops, a teal puddle — without the panel.
