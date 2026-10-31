---
id: T0117
title: "Lash: a Hive prestige gate, your horn darts split on hit"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T19:30:37Z
claimed_at: 2026-10-31T19:36:39Z
epic: E25
designer: desktop
---

## Goal
The Hive fills its last hole — it is the only tree without a prestige gate. After a prestige this life, a horn dart that hits a critter splits into small darts at that critter's neighbors: the crowd that chases you becomes your ammo.

## Details
- **Lash is an on-hit upgrade** that reacts only to your **Horn darts** (guard on the horn dart's id, the way Mend guards on the jab): when a horn dart hits a critter (monster or player), it sends **small darts** at the nearest other enemies within 100 of the critter it hit — the critter it hit is not one of the targets.
  - Rank 1: 2 small darts at the 2 nearest others. Rank 2: 3 small darts at the 3 nearest.
  - Fewer than that many others within 100: one dart per other that is there (one other, one dart; none, no split). The neighbors are counted at the moment of the hit — a critter that dies to the hit still counts as standing there.
  - **Small darts:** a new projectile (`lash-dart`), a small purple hexagon, half the horn dart's size with a thin white edge so it reads as a shard; straight, 400 u/s, 3 damage (players at half, as with all your hits), gone on hit or after 0.4 s. **They never split.**
  - At most 5 horn darts per volley (4 + 1 per rank) and 3 small darts each: up to ~15 lash darts alive per player at once.
  - Split's extra horn darts split too (more darts, more splits).
  - A small dart's hit counts as your hit (Swarm, Reap, Chill and the rest apply to it as to any hit), and a small dart's kill counts as your kill (Chomp, Nest, Sting, Scavenge, Adrenaline and Fang pay out on it).
- **Look:** when a dart splits, a small purple tick puff at the critter it hit (the wired-pop style, in purple).
- **Talent line (Hive tree, planning/modules/talents.md):** id `lash`, upgrade `lash`, max 2, needs `[["horn", 2]]`, points 3, prestige 1 — the gate shape of Cover, Bellow, Gore and Snare (3 points spent in the tree, 1 prestige this life).
- **Text:** "After 1 prestige this life. Your horn darts split on hit: each hit sends 2 small darts (3 damage, 0.4 s) at the 2 nearest other enemies within 100. Rank 2: 3 small darts."
- **With every weapon:** Lash reacts only to horn darts. Swarm's crowd scaling, Nest, Sting, Leech and Scavenge keep working exactly as they do, and nothing Lash does touches any other weapon.

## Compared with what exists
Lash is an on-hit, so one row for every on-hit and on-kill upgrade that exists:

| Existing | What it shares | What Lash does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | on-hit that sends a shot onward | bounces the bolt that hit on to one nearby enemy; Lash sends new darts at the neighbors of the critter that was hit |
| Reckless | on-hit that changes the hit | doubles your hit while you are hurt; Lash's darts hit other critters, the one hit is done |
| Chill | on-hit that acts on the victim it hit | slows it; Lash's darts don't slow, they hit what stands beside it |
| Reap | on-hit extra damage | adds damage to the half-dead target it hit; Lash's damage lands on other enemies within 100 |
| Swarm | on-hit scaled by the crowd around the target | makes this hit bigger per neighbor; Lash makes new hits at the neighbors themselves |
| Leech | on-hit that pays the attacker | heals you while the crowd is on you; Lash spends the crowd around the target as ammo |
| Mend | on-hit that heals the attacker | heals you on a Nerve hit; Lash's darts hurt others |
| Gore | on-hit that extends a shot | lets a Nerve jab pass through while you are hurt; Lash's darts turn to new targets instead of passing through |
| Cling | on-hit that lays a field on the target | splats and rides the critter it hit; Lash leaves the critter alone and hits its neighbors |
| Snare | on-hit that marks the victim | saps the victim so your damage bites it harder; Lash's darts are their own hits, on other critters |
| Chomp | on-kill | heals you when a kill happens; Lash fires on a hit that kills nothing |
| Adrenaline | on-kill that buffs you | sprints you on a kill while hurt; Lash fires on every hit |
| Fang | on-kill coin | pays coins on a kill while hurt; Lash pays damage |
| Fuse | a kill that spawns a one-shot ring | a ring where a bubble killed; Lash's darts fly at living neighbors, on a hit not a kill |
| Scatter | a kill that spawns seekers | 4 mini-Goo from a Goo kill that home and pop no further; Lash spawns from any horn hit, aimed at the neighbors of the critter hit, up to 3 |
| Gush | a kill that lays a puddle | a slow puddle at a Goo kill; Lash's darts strike once and are gone |
| Chew | a puddle that bites | bites whatever stands in your Gush puddle; Lash bites where it aims, at the neighbors |
| Nest | on-kill heal per neighbor | heals per neighbor of the corpse; Lash hits the neighbors while they are alive |
| Sting | on-kill burst in a crowd | bursts the corpse when 2+ neighbors are within 80; Lash doesn't need a kill and hits the neighbors directly |
| Scavenge | on-kill xp per neighbor | pays xp per neighbor of the corpse; Lash pays damage per neighbor of the living critter it hit |

## Acceptance criteria
- [ ] A player with Lash and 1+ prestige this life: a horn dart that hits a critter with 2+ other enemies within 100 sends 2 small darts (rank 1) at the 2 nearest others — 3 damage each, straight, 400 u/s, gone on hit or after 0.4 s.
- [ ] At rank 2, 3 small darts at the 3 nearest.
- [ ] One other enemy within 100: one small dart; none within 100: no split, and the horn dart's hit is unchanged.
- [ ] Small darts never split on hit.
- [ ] With 0 prestiges this life, Lash is not available in the panel; after 1 prestige it opens.
- [ ] A small dart that kills a monster pays Chomp/Nest/Sting/Scavenge as your kill, and its hit gets Swarm's crowd bonus.
- [ ] Small darts read as shards: half the horn dart's size with a white edge, and a purple tick puff where a dart splits.
- [ ] Lash is in the Hive tab under Horn, needs Horn 2, 2 ranks, 3 points in the tree, 1 prestige this life, with the text above.
