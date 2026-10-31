---
id: T0064
title: "Hive tree, second slice: Nest and the Sting capstone"
size: M
priority: 2
status: design
depends_on: [T0063]
attempts: 0
created: 2026-10-31T12:00:08Z
epic: E16
---

## Goal
The Hive tree gets its fork and its capstone: a kill inside the crowd banks a timed damage buff (Nest), and a kill with a crowd around the victim bursts (Sting) — so a full Hive life picks a direction after Swarm and Horn instead of buying the same four talents.

## Details
Extends the tree from T0063 (src/content/talents/hive.ts) with two more talent lines (exact):
- id nest, upgrade nest, max 4, needs [["swarm", 1]]
- id sting, upgrade sting, max 1, needs [["horn", 3], ["nest", 2]]

As the panel draws the full tree:
```
Swarm (4)
  Horn (4, needs Swarm 2)
    Sting (1, needs Horn 3, Nest 2)
  Nest (4, needs Swarm 1)
```

**Nest** (an on-kill buff on the killer) — new src/content/upgrades/nest.ts:
- Text: "On a kill: +6% damage for 10 s per other enemy that was within 100 of the kill, up to 3. Per rank: +1 max stack (up to 6)."
- maxLevel 4, look: shape pentagon, color orange (#ffa94d).
- A timed damage status on the killer, one small status file per stack size (closest examples: the Wired 1/2 statuses on Adrenaline's sprint): six statuses, +6%, +12%, +18%, +24%, +30%, +36% damage, each for 10 s.
- The kill's crowd picks the size: one stack per other enemy (monsters and players) that was within 100 of the kill, capped by the rank — rank 1: 3 stacks, rank 2: 4, rank 3: 5, rank 4: 6. Each qualifying kill applies its status and refreshes the 10 s; a smaller crowd replaces the bigger size.
- It triggers on any weapon's kill — a monster kill or a player knockout: it rewards finishing fights inside the crowd, whatever you fired.

**Sting** (the capstone, an on-kill burst) — new src/content/upgrades/sting.ts:
- Text: "When you kill an enemy with 2 or more other enemies within 80 of it, it bursts: a ring (radius 80) deals 12 damage to everything in it, monsters and players alike."
- maxLevel 1, look: shape star, color orange (#ffa94d).
- On a qualifying kill (any weapon, a monster or a player), a new area at the kill's spot (closest example: the Popper's pop-puff): a still teal field, radius 80, strikes everything standing in it (monsters and players) once for 12, gone after 0.3 s.
- A new effect with it (closest example: the splash-ring where a bubble lands): a teal ring with an ink rim blooming out to radius 80 over 0.3 s, then popping into 12 small teal confetti.

## Compared with what exists (upgrades)
Nest vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | an on-kill effect on the killer | a flat heal; Nest is a timed damage buff sized by the crowd at the kill |
| Adrenaline | an on-kill effect on the killer | a speed burst while you are hurt; Nest is damage, and it needs a crowd, not missing hp |
| Fang | an on-kill effect on the killer | coins while you are hurt; Nest is a damage buff sized by the crowd at the kill |
| Reckless | damage in a risky state | a flat doubling while you are hurt; Nest stacks per neighbor and fades after 10 s |
| Reap | bonus damage per hit | a flat +6 on hurt targets; Nest is a timed multiplier on everything you fire |
| Chill | an on-hit effect | a slow status on the target; Nest buffs the killer |
| Cling | an on-hit effect | a Goo-only splat that rides the target |
| Ricochet | an on-hit reaction | a Bolt-only bounce to another enemy |
| Fuse | an on-kill that deals damage | a fixed ring from a bubble kill; Nest is a buff on the killer, sized by the crowd |
| Gush | an on-kill that marks the ground | a slow puddle where a Goo kills; Nest is a buff on the killer |
| Chew | an on-kill effect | puddle damage; Nest is a buff on the killer |
| Scatter | an on-kill that pops | homing minis from a Goo kill; Nest is a buff on the killer |

Sting vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Fuse | an on-kill ring that deals damage | a fixed ring from a bubble kill; Sting needs 2+ neighbors within 80 and works off any weapon |
| Scatter | an on-kill pop | homing minis at the neighbors; Sting is a burst where the fight just happened |
| Chomp | an on-kill effect on the killer | a heal; Sting is a damage burst at the kill's spot |
| Adrenaline | an on-kill effect on the killer | a speed burst while you are hurt; Sting is a damage burst that needs a crowd |
| Fang | an on-kill effect on the killer | coins while you are hurt; Sting is a damage burst that needs a crowd |
| Gush | an on-kill that marks the ground | a slow puddle; Sting is an immediate burst |
| Chew | an on-kill effect | puddle damage over time; Sting is a one-strike burst |
| Reckless | damage in a fight | a flat doubling while you are hurt; Sting needs 2+ neighbors within 80 |
| Reap | bonus damage on a hit | per-hit on hurt targets, not a burst on a kill |
| Chill | an on-hit effect | a slow status on the target |
| Cling | an on-hit effect | a Goo-only splat that rides the target |
| Ricochet | an on-hit reaction | a Bolt-only bounce to another enemy |

## What a Hive life gets and what it costs
- Sting takes at least 7 points (Swarm 2, Horn 3, Nest 2) and the full tree is 13 ranks — a whole life of levels.
- A Hive build is the weakest in the crowd early, until Swarm and Horn land, and the strongest inside a dense swarm once they do; Nest and Sting make a full build punish the moment a fight turns crowded.

## Acceptance criteria
- [ ] The Hive tab draws the full tree: Nest under Swarm with its lock text, Sting under Horn, locked until Horn 3 and Nest 2.
- [ ] At Nest 1, killing a monster with 2 other enemies within 100 of it gives the killer +12% damage for 10 s, refreshed by the next qualifying kill; at Nest 4 a kill with 6 other enemies within 100 gives +36%.
- [ ] A kill with no other enemy within 100 gives no Nest buff.
- [ ] At Sting, killing any enemy (monster or player) with 2 or more other enemies within 80 of it lays the teal ring (radius 80, 12 damage to everything inside, one strike) and plays the blooming teal ring with 12 small confetti.
- [ ] Nest triggers on any weapon's kill, including a plain Bolt kill.
- [ ] A fresh life starts as a nomad with Bolt only, with no Hive ranks.
