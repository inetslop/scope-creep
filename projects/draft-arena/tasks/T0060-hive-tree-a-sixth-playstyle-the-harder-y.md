---
id: T0060
title: "Hive tree: a sixth playstyle, the harder you hit the more crowded the fight is"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T11:40:36Z
epic: E16
---

## Goal
A sixth talent tree (the cap, none removed): a build whose power grows with the crowd around what it hits, so a Hive life runs into the swarm instead of kiting it — Gunner kites at range, Goober zones a spot, Frenzy bleeds itself, Hive feeds on the neighbors.

## Details
A new tree file in src/content/talents/ (closest example: src/content/talents/frenzy.ts, a mod-first tree with a fork), listed in TREES:
- name: "Hive", description: "The more crowded the fight, the harder you hit.", look: shape hexagon, color orange (#ffa94d).

Talent lines (exact):
- id swarm, upgrade swarm, max 4
- id horn, upgrade horn, max 4, needs [["swarm", 2]]
- id nest, upgrade nest, max 4, needs [["swarm", 1]]
- id sting, upgrade sting, max 1, needs [["horn", 3], ["nest", 2]]

As the panel draws it:
```
Swarm (4)
  Horn (4, needs Swarm 2)
    Sting (1, needs Horn 3, Nest 2)
  Nest (4, needs Swarm 1)
```

**Swarm** (on-hit mod, any weapon) — new src/content/upgrades/swarm.ts:
- Text: "Hits deal +2 damage per other enemy within 80 of the target, up to 3. Per rank: +2 damage per enemy."
- maxLevel 4, look: hexagon, orange.
- With every weapon: Bolt — each bolt hit counts the other enemies standing within 80 of the struck critter; Maw — each bite hit counts the neighbors in the bite, so Maw + Swarm shreds a tight crowd; Lob — each enemy hit by a splash counts the other splash victims; Goo — counts the neighbors of the struck critter; Nerve — counts the neighbors of the jabbed critter; Slush — each puddle tick counts the neighbors standing in the puddle. The bonus is flat damage: it lands on other players at half, like all your damage.
- What it is not: a condition on the target's hp (Reap) or on your own hp (Reckless); it is a condition on the surroundings, and it works with a fully healthy player on a full-hp target.

**Horn** (the tree's weapon) — new src/content/upgrades/horn.ts:
- Text: "Every 0.8 s, a fast teal dart at the nearest enemy within 240. 9 damage. Per rank: +3 damage."
- maxLevel 4, look: triangle, teal.
- Aims the nearest enemy within 240; with none in range it holds. One dart per shot, straight (no path, no step, like the jab): a new projectile file, a small teal narrow diamond with an ink outline, 450 u/s, gone on hit or after 0.7 s.
- Mods that apply to it: every on-hit (Swarm, Chill, Reap, Reckless), every shot stat (Split, Haste, Quick), Might and Frenzy. Not Lance, Ricochet (Bolt only), Cling, Gush, Chew, Scatter (Goo only), Fuse (bubble only). Split fans one more dart 12% weaker, as it does with every weapon.

**Nest** (on-kill buff on yourself) — new src/content/upgrades/nest.ts:
- Text: "On a kill: +6% damage for 10 s per other enemy that was within 100 of the kill, up to 3. Per rank: +1 max stack (up to 6)."
- maxLevel 4, look: pentagon, orange.
- A timed damage status on the killer, one per rank (closest example: the Wired statuses on Adrenaline's sprint): 10 s, refreshed on each qualifying kill; a monster kill and a player knockout both count, and other enemies within 100 include players.
- Works with every weapon: any weapon's kill can trigger it — that is the point, it rewards finishing fights inside the crowd, whatever you fired.

**Sting** (capstone, on-kill burst) — new src/content/upgrades/sting.ts:
- Text: "When you kill an enemy with 2 or more other enemies within 80 of it, it bursts: a ring (radius 80) deals 12 damage to everything in it, monsters and players alike."
- maxLevel 1, look: star, orange.
- The burst is a new teal ring effect at the kill's spot (closest example: the Fuse ring): ink rim, spreads to radius 80 over 0.3 s, 12 small teal confetti, one pop.
- Triggers on any weapon's kill of a monster or a player, when the victim stood with 2+ other enemies within 80.

## Compared with what exists (trees)
| Existing tree | What it shares | What Hive gives that it can't |
| --- | --- | --- |
| Gunner | a self-firing projectile tree with mods for the weapon | kites at range; Hive is a close-range tree whose hits grow with the neighbors of the target |
| Body | cheap mods first, a weapon behind them | flat stats for a tank; Hive's power scales with the crowd and is near nothing alone |
| Lobber | a weapon plus ground work | zones a spot on the ground; Hive multiplies its own hits in a dense fight |
| Goober | a self-aiming weapon plus kill effects | kill effects with a fixed radius; Hive's buff and burst scale with how many stood nearby |
| Frenzy | a mod-first tree that pays out in a state | pays on your own missing hp; Hive pays on the enemies around the target — the risk is positioning in a crowd, not taking damage |

## Compared with what exists (upgrades)
Horn vs the other weapons:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Bolt | self-firing straight shots at the nearest enemy | one fast short-range dart meant to be multiplied by Swarm; Bolt grows in volleys and pierce/bounce mods |
| Maw | a short-range attack | a bite area in front of you; Horn picks a target and darts it |
| Lob | a self-firing weapon | an arcing splash that marks the ground; Horn is a direct hit |
| Goo | self-firing at the nearest enemy | a drop that turns and hunts; Horn is a flat dart at a fixed range |
| Nerve | a fast short-range single-target hit | a flat 9 +3/rank that scales with the crowd via Swarm, not with your missing hp |
| Slush | a self-firing lob | a blob that lands and lingers as a puddle; Horn is a direct hit |

Swarm vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Reap | bonus damage on a hit | keyed to the target's hp, not to the neighbors around it |
| Reckless | harder hits in a risky state | keyed to your own hp, not to the crowd |
| Chill | an on-hit effect | a status on the target, not flat bonus damage |
| Cling | an on-hit effect | a Goo-only splat that rides the target |
| Ricochet | an on-hit reaction | a Bolt-only bounce to another enemy |
| Chomp | an on-kill effect | heals the killer; Swarm adds damage to every hit |
| Adrenaline | an on-kill effect | a speed burst; Swarm adds damage to every hit |
| Fuse | an on-kill that deals damage | a fixed ring from a bubble kill; Swarm is per-hit, any weapon |
| Gush | an on-kill that marks the ground | a puddle; Swarm adds damage to every hit |
| Chew | an on-kill effect | puddle damage; Swarm adds damage to every hit |
| Scatter | an on-kill that pops | homing minis from a Goo kill; Swarm is per-hit, any weapon |

Nest vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | an on-kill effect on the killer | a flat heal; Nest is a timed damage buff sized by the crowd at the kill |
| Adrenaline | an on-kill effect on the killer | a speed burst; Nest is damage |
| Reckless | damage in a risky state | a flat doubling while hurt; Nest stacks per neighbor and fades |
| Chill | damage-adjacent on-hit | a slow status on the target; Nest buffs the killer |
| Reap | bonus damage per hit | a flat +6 on hurt targets; Nest is a timed multiplier on everything |
| Cling | an on-hit effect | a splat that rides the target |
| Ricochet | an on-hit reaction | a Bolt-only bounce |
| Fuse | an on-kill that deals damage | a fixed ring from a bubble kill |
| Gush | an on-kill that marks the ground | a slow puddle |
| Chew | an on-kill effect | puddle damage |
| Scatter | an on-kill that pops | homing minis from a Goo kill |

Sting vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Fuse | an on-kill ring that deals damage | a fixed ring from a bubble kill; Sting needs a crowd at the kill and works off any weapon |
| Scatter | an on-kill pop | homing minis at the neighbors; Sting is a burst where the fight just happened |
| Chomp | an on-kill effect on the killer | a heal |
| Adrenaline | an on-kill effect on the killer | a speed burst |
| Gush | an on-kill that marks the ground | a slow puddle |
| Chew | an on-kill effect | puddle damage |
| Reckless | damage in a fight | a flat doubling while hurt; Sting needs 2+ neighbors within 80 |
| Reap | bonus damage on a hit | per-hit on hurt targets, not a burst on a kill |
| Chill | an on-hit effect | a slow status |
| Cling | an on-hit effect | a Goo-only splat |
| Ricochet | an on-hit reaction | a Bolt-only bounce |

## What a Hive life gets and what it costs
- To reach Sting takes 7+ points (Swarm 2, Horn 3, Nest 2, plus ranks); the full tree is 12 ranks, a whole life of levels.
- Those points could instead buy Swift, Haste, Might or a second tree's weapon; a Hive build is the weakest in the crowd early, until Swarm and Horn land, and it is the strongest inside a dense swarm once they do.

## Acceptance criteria
- [ ] The talents panel has a sixth tab, Hive (an orange hexagon), drawn Swarm on top, Horn and Nest under it, Sting under Horn, each locked one showing what it still needs.
- [ ] A level-2 nomad with only Bolt can buy Swarm 1, and each bolt hit then deals +2 per other enemy within 80 of the struck critter (up to 3).
- [ ] Horn 1 fires one teal dart at the nearest enemy within 240 every 0.8 s (9 damage) and holds when none is in range; rank 4 deals 18.
- [ ] Killing an enemy with 2 other enemies within 100 gives the killer +12% damage for 10 s at Nest 1, refreshed on the next such kill; at Nest 4 the cap is 6 stacks.
- [ ] With Horn 3 and Nest 2, a kill with 2+ other enemies within 80 of the victim plays the teal ring (radius 80, 12 damage to everything inside, monsters and players).
- [ ] A fresh life starts as a nomad with Bolt only, with no Hive ranks.
