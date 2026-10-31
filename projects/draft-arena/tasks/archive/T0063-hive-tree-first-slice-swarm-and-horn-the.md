---
id: T0063
title: "Hive tree, first slice: Swarm and Horn, the more crowded the fight the harder you hit"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-31T12:00:08Z
claimed_at: 2026-10-31T12:20:30Z
finished_at: 2026-10-31T12:36:26Z
epic: E16
design_attempts: 1
---

## Goal
The sixth talent tree (the cap, none removed) starts playable end to end: a level-2 nomad buys Swarm and every hit grows with the crowd standing around the target, and a committed life gets its own weapon, the fast short-range Horn — a Hive build runs into the swarm instead of kiting it.

## Details
A new tree file in src/content/talents/ (closest example: src/content/talents/frenzy.ts, a mod-first tree), listed in TREES:
- name: "Hive", description: "The more crowded the fight, the harder you hit.", look: shape hexagon, color orange (#ffa94d).

Talent lines (exact):
- id swarm, upgrade swarm, max 4
- id horn, upgrade horn, max 4, needs [["swarm", 2]]

As the panel draws it (Nest and Sting land in a later task; the tree grows under Swarm):
```
Swarm (4)
  Horn (4, needs Swarm 2)
```

**Swarm** (an on-hit mod, any weapon) — new src/content/upgrades/swarm.ts:
- Text: "Hits deal +2 damage per other enemy within 80 of the target, up to 3. Per rank: +2 per enemy."
- maxLevel 4, look: shape hexagon, color orange (#ffa94d).
- The bonus is flat damage, counted per hit: for each enemy you hit, count the other enemies (monsters and players) standing within 80 of the struck critter, up to 3, and add +2 per rank per neighbor. It works on a full-hp player hitting a full-hp target — a condition on the surroundings, not on hp (not Reap, not Reckless).
- With every weapon in the game it fires on every hit your weapons deal: Bolt bolts, Maw bites, Lob splashes, Goo drops, Nerve jabs, Slush puddle ticks, Goober's mini-Goo and the Fuse ring — always counting the neighbors of the struck critter (or, for an area hit, of the critter standing in it). The bonus lands on other players at half, like all your damage.

**Horn** (the tree's weapon) — new src/content/upgrades/horn.ts:
- Text: "Every 0.8 s, a fast teal dart at the nearest enemy within 240. 9 damage. Per rank: +3 damage."
- maxLevel 4, look: shape triangle, color teal.
- Aims the nearest enemy within 240; with none in range it holds. One dart per shot, straight (no path, no step: the closest example is the jab) — a new projectile file: a small teal narrow diamond with an ink outline, 450 u/s, gone on hit or after 0.7 s.
- Mods that apply to it: every on-hit (Swarm, Chill, Reap, Reckless), every shot stat (Haste, Quick, Split — Split fans one more dart, 12% weaker, as with every weapon), Might and Frenzy. Not Lance or Ricochet (Bolt only), not Cling, Gush, Chew or Scatter (Goo only), not Fuse (bubble only).

## Compared with what exists (trees)
| Existing tree | What it shares | What Hive gives that it can't |
| --- | --- | --- |
| Gunner | a self-firing projectile tree with mods for the weapon | kites at range; Hive is a close-range tree whose hits grow with the neighbors of the target |
| Body | cheap mods first, a weapon behind them | flat stats for a tank; Hive's power scales with the crowd and is near nothing alone |
| Lobber | a weapon plus ground work | zones a spot on the ground; Hive multiplies its own hits in a dense fight |
| Goober | a self-aiming weapon plus kill effects | kill effects with a fixed radius; Hive's hits scale with how many stood nearby |
| Frenzy | a mod-first tree that pays out in a state | pays on your own missing hp; Hive pays on the enemies around the target — the risk is standing in a crowd, not taking damage |

## Compared with what exists (upgrades)
Horn vs the other weapons:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Bolt | a self-firing straight shot at the nearest enemy | a flat yellow bolt that grows in volleys and has pierce and bounce mods; Horn is one fast short-range teal dart meant to be multiplied by Swarm |
| Maw | a short-range attack | a bite area in front of you that hits whatever is in it; Horn picks one target and darts it |
| Lob | a self-firing weapon | an arcing bubble that splashes where it lands; Horn is a direct hit |
| Goo | a self-firing shot at the nearest enemy | a big drop that turns in flight to hunt; Horn is a flat dart at a fixed range |
| Nerve | a fast short-range single-target hit | hits harder the more hurt you are; Horn is flat damage that grows with the crowd via Swarm |
| Slush | a self-firing lob | a blob that lands and lingers as a slowing puddle; Horn is a direct hit |

Swarm vs the other on-hit and on-kill effects:
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Reap | bonus damage on a hit | keyed to the target's hp, not to the neighbors around it |
| Reckless | harder hits in a risky state | keyed to your own hp, not to the crowd |
| Chill | an on-hit effect | a slow status on the target, not flat bonus damage |
| Cling | an on-hit effect | a Goo-only splat that rides the target |
| Ricochet | an on-hit reaction | a Bolt-only bounce to another enemy |
| Chomp | an on-kill effect | heals the killer; Swarm adds damage to every hit |
| Adrenaline | an on-kill effect | a speed burst while you are hurt; Swarm adds damage to every hit |
| Fang | an on-kill effect | coins while you are hurt; Swarm adds damage to every hit |
| Fuse | an on-kill that deals damage | a fixed ring from a bubble kill; Swarm is per-hit, any weapon |
| Gush | an on-kill that marks the ground | a slow puddle where a Goo kills; Swarm adds damage to every hit |
| Chew | an on-kill effect | puddle damage; Swarm adds damage to every hit |
| Scatter | an on-kill that pops | homing minis from a Goo kill; Swarm is per-hit, any weapon |

## What a Hive life gets and what it costs
- Swarm 1 is one point at level 2, before any commitment — but Horn 1 needs 3 points (Swarm 2, Horn 1), and those same points could buy Swift, Haste, Might or a second tree's weapon.
- Until Horn lands, a Swarm-only life is a bolt build with a crowd bonus: near nothing in an open field, strong in a tight swarm.

## Acceptance criteria
- [ ] The talents panel has a sixth tab, Hive (an orange hexagon), drawn Swarm on top and Horn under it with its lock text; the other five trees are unchanged.
- [ ] A level-2 nomad with only Bolt can buy Swarm 1, and each bolt hit then deals +2 damage per other enemy within 80 of the struck critter, up to 3; at Swarm 4 it is +8 per neighbor.
- [ ] Horn 1 fires one small teal narrow diamond at the nearest enemy within 240 every 0.8 s (9 damage) and holds when none is in range; rank 4 deals 18.
- [ ] Swarm works with Horn: a horn hit on a critter with 2 other enemies within 80 of it deals +2 per rank extra at Swarm 1.
- [ ] A fresh life starts as a nomad with Bolt only, with no Hive ranks.
- [ ] The Hive tab and its talent texts fit at 412x915 and 1280x720 with nothing cut off.

## Rejected by architect (inet-racing)

Swarm's comparison table is missing a row for Mend (src/content/upgrades/mend.ts), an onHit upgrade — every on-hit/on-kill upgrade needs a row (e.g. "an on-hit effect | heals the attacker on Nerve hits only; Swarm adds damage to every hit, any weapon").
