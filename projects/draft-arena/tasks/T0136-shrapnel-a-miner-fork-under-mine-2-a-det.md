---
id: T0136
title: "Shrapnel: a Miner fork under Mine 2, a detonation flings ice shards at the crowd around it"
size: M
priority: 2
status: design
depends_on: [T0135]
attempts: 0
created: 2026-10-31T23:01:32Z
epic: E31
---

## Goal
The Mine's first fork: a detonation is no longer only a circle at the feet. It flings shards at the crowd that gathers around the blast, so a mine you laid 8 s ago still pokes the enemies its circle missed — the trap's reach grows beyond its radius.

## Details
- Talent (in the Miner tree's file, after the mine line): id shrapnel, upgrade shrapnel, max 2, needs [["mine",2]].
- The panel draws it under Mine:
  ```
  Mine (5, needs Last 1)
    Shrapnel (2, needs Mine 2)
  ```
- Upgrade (new file, src/content/upgrades/shrapnel.ts): name "Shrapnel", maxLevel 2, look: shape star, color #3bc9db.
- Text: "When one of your mines detonates, it flings ice shards: 3 at the 3 nearest enemies within 120, 6 damage each. Per rank: +1 shard, +30 range."
- Behavior: when one of your mines detonates — once per mine, not per critter the blast strikes — shards fly from the mine's spot at the 3 nearest enemies within 120 of it (rank 2: 4 within 150), nearest first. The owner is never a target. A detonation with no enemy in range flings nothing.
- The shards (new projectile, src/content/projectiles/shard.ts): small ice shards with an ink outline (the jab's shape, ice with a teal tinge), straight, 220 u/s, 0.4 s, gone on hit or when their time runs out. They move by a simple path computed on launch (like the jab); at most 4 per detonation, and at most 6 of your mines can be alive at once, so at most 24 shards per player at a moment — all path-based, no per-tick steering.
- A shard's hit is a normal hit: every non-weapon-conditional on-hit upgrade runs on it (Chill, Reap, Swarm, Reckless, Snare, Leech, Glide), and a kill by a shard is a normal kill (the gem, the kill coin, a level-4+ corpse gem, the non-weapon-conditional on-kills). Shards never split, bounce or chain.
- Which mods apply: the player's damage stat scales the shards' 6 damage (a hit); Haste does not affect the shards (they fire on a detonation, not on a cooldown); Split, Lance, Wide and Quick do nothing to them.
- What the player sees: a fan of small ice shards bursting out of the mine's pop at the critters around it — readable as the mine's own signature, since the shards are ice like the mine's ring and fly from the blast, not from a body.

## Compared with what exists

Shrapnel triggers on an area's strike, the way Fizz triggers on a splash landing. One row per on-hit upgrade, plus the upgrades it is close to:

| Existing | What it shares | What Shrapnel does that it can't |
| --- | --- | --- |
| Ricochet | a hit spawns a new bolt near the hit | Ricochet re-fires the bolt itself, one bounce, along the bolt's line; Shrapnel's shards are new shots from a mine on the ground, at up to 4 neighbors around the blast, from a spot you left up to 8 s ago |
| Reckless | an on-hit that changes the hit | Reckless doubles the hit's own damage below half hp; Shrapnel adds shots where the hit was — the blast's damage is unchanged |
| Chill | an on-hit that applies a status | Chill slows the critter the hit touched; Shrapnel extends the hit's reach with shots at the crowd around it |
| Reap | an on-hit bonus on a half-dead target | Reap sharpens the hit on a wounded target; Shrapnel pokes the whole crowd around the blast, wounded or not |
| Swarm | an on-hit that scales with the crowd | Swarm sharpens each hit the more enemies are around its target; Shrapnel adds shots at the crowd — at rank 2 it hits 4 of them instead of sharpening them |
| Leech | an on-hit that pays the player back | Leech heals you while your hits land in a crowd; Shrapnel turns the hit's moment into a fan of shards at the crowd around the blast |
| Mend | an on-hit on one weapon (Nerve) | Mend heals you on your own Nerve hits; Shrapnel is a weapon-conditional on-hit like Mend, but it triggers on your mine's blasts and adds reach instead of sustain |
| Lash | a hit spawns small darts at the neighbors | Lash's darts fly from the target your dart hit, splitting the dart's own line; Shrapnel's shards fly from the mine's spot at the 3-4 nearest enemies around the blast — a trap laid earlier pokes the crowd that gathers on it, not the critter you hit |
| Gore | an on-hit on one weapon (Nerve), while hurt | Gore makes the Nerve jab go through more enemies below half hp; Shrapnel's shards are new shots at the blast's neighbors, and they fire whether you are hurt or not |
| Glide | an on-hit that moves the player | Glide speeds you up while your hits land in a crowd; Shrapnel sends the hit's energy outward as shards at the crowd around the blast |
| Cling | a hit splats on the target | Cling sticks a damage tick to the one critter the Goo touched; Shrapnel radiates from the mine's spot at the several critters around it |
| Snare | a hit applies a sap mark | Snare marks whatever your Gush puddle saps so it takes more damage; Shrapnel's shards deal their own 6 damage to whatever is near the blast |
| Fizz | an on-hit on one weapon (Lob) that lingers the zone | Fizz makes the splash you threw keep ticking; Shrapnel makes the mine you laid pop outward with shards at the neighbors — a one-time burst of reach, not a longer zone |
| Horn | darts at the nearest on a timer | Horn fires its own darts at up to 4 of the nearest enemies every 0.8 s while you stand where the crowd is; Shrapnel's shards come from a detonation on the ground, at whatever is near that spot, on no timer of your own |

## Acceptance criteria
- [ ] With Mine 2 and Shrapnel, a mine's pop flings 3 ice shards from the mine's spot at the 3 nearest enemies within 120 (rank 2: 4 within 150), 6 damage each; the shards fly straight, die on hit or after 0.4 s, and never target the owner.
- [ ] The shards' hits and kills behave as normal hits: on-hit upgrades run on them and a shard kill pays the gem, the coin and the on-kill upgrades.
- [ ] A detonation with no enemy in range flings nothing; two mines that pop at the same spot each get their own fan.
- [ ] `npm run check` and `npm run smoke` pass.
