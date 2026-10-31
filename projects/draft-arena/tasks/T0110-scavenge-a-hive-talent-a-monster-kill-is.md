---
id: T0110
title: "Scavenge: a Hive talent, a monster kill is worth xp per enemy around the corpse"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T18:10:25Z
claimed_at: 2026-10-31T18:10:28Z
epic: E23
designer: desktop
---

## Goal
The Hive's crowd pays in the draft: a monster killed while the swarm is around the corpse is worth extra xp, so a Hive life that runs into the swarm banks talent points from the very kills it makes in the middle of it. This is the rebuilt Hive fork of E23 — the shield (Thicket, T0108) is not buildable, the crowd fork becomes the pay.

## Details
- A new on-kill upgrade `scavenge` in the Hive tree, a sibling fork with Leech under Swarm.
- Text (shown on the talent's row): "A monster kill is worth +1 xp per other living critter within 80 of the corpse (up to 3). Per rank: +1 more per neighbor."
- Talent line: id scavenge, upgrade scavenge, max 3, needs `[["swarm", 1]]`. No points commitment, no prestige gate — a fork picked at the 2nd point in the tree.
- The count is taken the moment the monster dies: other living critters (monsters and players alike) within 80 units of the corpse, up to 3. Rank 1 pays 1 xp per neighbor, rank 2 pays 2, rank 3 pays 3 (so a kill with 3 neighbors pays 3, 6 or 9 xp).
- The xp lands like any xp, with a small yellow star at the corpse (like the level-up ring's stars) so the pay is visible.
- Works with every weapon the Hive player has — the Horn's darts, a borrowed Maw bite, a bubble splash, any field: the kill counts once, no matter how many of your things hit the corpse.
- Player knockouts pay nothing: their bounty xp is theirs (the mark, the crown's bounty, the corpse gem are all unchanged).
- Works with 6 players (bots fill the field, the swarm is the neighbor) and with 60 (more crowded fields, more neighbors to count).
- look: shape star, color #ffd43b — the level's yellow, the talent that pays in levels.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a kill pays the killer | Chomp heals hp from any kill, always; Scavenge pays xp only while the corpse is crowded, so a kill alone is worth nothing extra |
| Adrenaline | a kill that pays under a condition | Adrenaline sprints while you are hurt; Scavenge pays while the crowd is around the corpse, at any hp |
| Fang | a kill that pays a currency under a condition | Fang pays coins while you are hurt; Scavenge pays xp while the corpse is crowded, and xp buys the draft Fang never touches |
| Fuse | a specific weapon's kill triggers a thing | Fuse pops a damage ring around a bubble kill; Scavenge works with every weapon and pays xp instead of damage |
| Scatter | a kill pops something at the corpse | Scatter turns a Goo kill into chasing mini-Goo; Scavenge pays the killer xp that scales with the neighbors |
| Gush | a Goo kill marks the corpse | Gush leaves a slow puddle to stand in; Scavenge is paid once at the kill and works with any weapon |
| Chew | the corpse's mark bites what stands in it | Chew damages what stands in the Gush puddle over time; Scavenge pays xp once at the kill and does not linger |
| Nest | a kill that pays more the more crowded the corpse is | Nest heals the killer from the crowd; Scavenge pays the same crowd in xp, so the swarm that feeds hp feeds the draft too, and both can stack on one kill |
| Sting | a kill in a crowded spot triggers | Sting bursts the corpse to damage its neighbors; Scavenge pays the killer xp instead — the burst stays the capstone, the pay is the fork |

The tree as the panel will draw it (Hive after this task):
```
Swarm (3)
  Horn (3, needs Swarm 1)
    Nest (3, needs Horn 2)
      Sting (1, needs Horn 3, Nest 2)
  Leech (3, needs Swarm 1)
  Scavenge (3, needs Swarm 1)
```
What a Hive player gets, and what it costs: 1–3 points under Swarm 1 (Swarm 1 is the tree's first point), where those points could buy Leech (the swarm feeds hp) or start the Horn (the swarm is your weapon). Scavenge is the third pull: the swarm pays the draft — a dense-swarm kill at rank 3 is worth 9 xp (about two thirds of a level), so a swarm fight banks a point or two in the life, and a Hive build chooses between healing, weapons and levels from the same crowd.

## Acceptance criteria
- [ ] The Talents panel's Hive tab shows Scavenge under Swarm, beside Leech, with its text and 3 ranks; it takes a point once Swarm 1 is bought.
- [ ] Killing a monster with 0, 2 and 4 other critters within 80 of the corpse pays 0, 2 and 3 xp at rank 1, and 0, 6 and 9 at rank 3.
- [ ] The kill counts once per death with any weapon (Horn darts included), the pay shows as a small yellow star at the corpse, and a player knockout pays no Scavenge xp.
- [ ] The rest of the tree, the mark, the crown and the corpse gem behave as before, and the game is working and playable.
