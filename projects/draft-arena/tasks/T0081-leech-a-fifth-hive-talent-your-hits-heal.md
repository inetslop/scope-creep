---
id: T0081
title: "Leech: a fifth Hive talent, your hits heal you while the crowd is on you"
size: M
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T13:48:21Z
epic: E16
---

## Goal
The sustain fork under Swarm in the Hive tree: Leech — while the crowd is on you, every hit you land heals you — so a Hive life runs into the swarm not only to hit harder but to stay alive in it.

## Details
- New on-hit upgrade "Leech" in src/content/upgrades/ (closest example: swarm.ts — an on-hit that counts nearby enemies — with a heal, closest example: mend.ts).
- Panel text: "While 3+ enemies are within 80 of you, your hits heal 1 hp. Per rank: +1 hp."
- maxLevel 3: while 3 or more other enemies (monsters and players) are within 80 of you, each hit you land heals you 1 hp (rank 1), 2 hp (rank 2) or 3 hp (rank 3). Heals cap at your max hp (as Chomp's do).
- The count is enemies within 80 of you, counted the way Swarm counts, refreshed as they move: walk out of the cluster and your next hit heals nothing.
- Works with every weapon and area: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Horn's dart, Slush's blob and puddle, and your own puddle tick all heal while the crowd is on you.
- Nothing new on screen: the heal reads as your hp coming back and the wound collar shrinking while you chew on the crowd.
- Talent line: id leech, upgrade leech, max 3, needs [["swarm", 1]] — in the Hive tree.
- The tree as the panel will draw it (before T0076's Nest and Sting land):
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
    Leech (3, needs Swarm 1)
  ```
  Leech needs no other talent; T0076's talents hang off Swarm 3, so Leech builds before or after them.
- What it costs: 1 point after Swarm 1; the same point could buy Horn 1. Leech makes the swarm a place to stand in; Horn makes it a place to shoot from — a fork either way.
- The count runs only when a hit lands (no per-tick cost for a player who is not in a crowd).

## Acceptance criteria
- [ ] The Hive tab in the talents panel shows Leech under Swarm, next to Horn, with its text.
- [ ] With 3+ enemies within 80 of you, every hit you land heals 1 hp (rank 1); with 1 or 2 within 80, hits heal nothing.
- [ ] Rank 3: 3 hp per hit, and the heal never takes you above max hp.
- [ ] Walk out of the cluster: your next hit heals nothing, even if the last hit landed inside it.
- [ ] A Hive player standing in a dense swarm of Dots watches its hp climb (the wound collar shrinks) while it keeps the crowd off with Horn or Bolt.
- [ ] The count includes other players, not only monsters.
- [ ] Bots with Leech behave the same in a 60-player match.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit | Ricochet bounces a bolt on to another enemy; Leech heals you on a hit while the crowd is on you |
| Reckless | an on-hit that pays on a state | Reckless pays while you are hurt with double damage; Leech pays while 3+ enemies are around you with heal |
| Chill | an on-hit | Chill slows the target; Leech only affects you |
| Reap | an on-hit that reads a state | Reap reads the target's hp; Leech reads how crowded you are |
| Swarm | an on-hit that counts nearby enemies | Swarm scales your damage by the crowd around the target; Leech scales your heal by the crowd around you, with any weapon |
| Mend | an on-hit that heals you | Mend heals on a Nerve hit per missing hp; Leech heals on any hit while 3+ are within 80 of you |
| Cling | an on-hit tied to a weapon's hits | Cling makes a Goo splat on and ride its target; Leech is your own sustain in a crowd |
| Chomp | a heal on a kill | Chomp heals a fixed 5 hp (25 on a player) per kill; Leech heals per hit while the crowd is on you, with any weapon |
