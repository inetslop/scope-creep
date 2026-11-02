---
id: T0435
title: "The Fracture: the wave-100 boss that splits when it dies"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T17:22:19Z
claimed_at: 2026-11-02T17:22:22Z
designer: desktop
---

## Goal
The next boss in the lane, wave 100: a big shape that walks the road and, the moment it dies, bursts into three fast Shards at the death spot — the wave's last word is where the player chose to kill it.

## Details
- The wave-100 plan sends exactly one Fracture, nothing else (the Colossus's whole-wave rule); the boss lane carries it through the bossId and the boss tag: the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, the escape horn.
- The split: the moment the Fracture dies it flashes white for ~0.3 s (the Orb's break flash), then 3 Shards walk out of the death spot — the Orb's own children, the wave's own scaling, walking the road from that spot. The shards are ordinary enemies from then on: their own gold, ordinary hits, the near miss, the wave's count — the wave ends when they are done.
- A leaked Fracture never splits: it costs 1 life (with the escape horn) and the wave ends with it.
- The death spot is the player's decision: killed in the entrance third, the 3 Shards have the whole road ahead of them; killed at the exit, they barely walk. The wave's pressure is the kill's location.
- The first split teaches once: a small white "it splits when it dies" chip at the death spot (the leechTell's pattern, once per run).
- Look: a new silhouette — a purple trefoil (three joined lobes; no enemy is a trefoil — the purple shapes in use are square, hexagon, pentagon, ring, chevron, wings), size 0.5 (the boss norm), with two thin cracks between the lobes that deepen as it takes damage (the orbSplit live-crack pattern, one per crack line).
- Exact numbers: hp 720 (the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 100, spawnOnly, threat = the wave-100 budget (the whole wave in one shape, the Colossus's rule).
- What counters it: the early road — the choke, the marked cells and the scorch cells are where the hundred should die; a burst build that kills it late hands three Shards to the last stretch.
- What it punishes: the "the wave is over when the boss dies" habit, and killing the boss where it is convenient instead of where it is safe.

## Compared with what exists

| Existing | What it shares | What the Fracture does that it can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker | its death is an ordinary death; the Fracture's death is the wave's last word, not its last enemy |
| Block | `walk`, slow and tough | leaking it costs 2 lives and ends it; the Fracture ends with three Shards on the road, not with its leak |
| Colossus | `walk`, the whole wave in one shape | it survives by going out of reach on a clock; the Fracture gets its second life only when it is already dead |
| Guard | `walk`, a spawnOnly escort | carries the Titan's shield; the Fracture is the whole wave, and its death is what makes the Shards |
| Titan | `walk`, a boss that halves damage | it lives while its Guard lives; the Fracture lives on after its own death |
| Orb | `walk`, splits at half hp | it splits while alive, on a clock, into two; the Fracture splits only when it dies, and the death spot is where the player chose |
| Hive | `walk`, pops a Dot every 6 s | grows the group while it lives; the Fracture grows the group only at its death |
| Shard | `walk`, a fast split piece | is a fragment of a killed enemy; the Fracture's death makes three of them at the spot the player chose |
| Sprinter | `walk`, ramps faster when hit | survives by outrunning the damage it takes; the Fracture survives by splitting into pieces that outrun the road |
| Splitter | `walk`, splits into two Splinters | is a regular enemy making two small pieces; the Fracture is the wave's boss and its three Shards carry the wave's full hp scaling |
| Hauler | `walk`, a leak costs gold | its death pays 10 gold and nothing more; the Fracture's death costs the road three Shards |
| Mute | `walk`, holds the towers within 2 cells still | interacts with the towers while it lives; the Fracture interacts with the road after it dies |
| Flyer | `fly`, crosses the board in a straight line | avoids the road entirely; the Fracture walks the road and leaves three Shards on it |
| Ward | `walk`, ignores control | survives by being untouched by slow, root and gust; the Fracture takes every hit and still gets out |
| Leech | `walk`, a boss that drinks its escorts | survives by drinking while it lives; the Fracture survives by splitting after it dies |
| Mender | `walk`, a boss that restores hp | mends itself while it lives, four times; the Fracture "mends" once, at its death, into three pieces |
| Bulwark | `walk`, a plate across its front | survives by facing the wrong way; the Fracture survives by being killed in the wrong place |
| Splinter | `walk`, fast and small | is a piece of a killed Splitter; the Fracture's death makes three Shards, not two Splinters |

## Acceptance criteria
- [ ] Wave 100 sends exactly one Fracture, nothing else; the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, and the escape horn all wear it through the boss lane.
- [ ] The Fracture's death: the boss's own burst, horn and name card, then the ~0.3 s white flash and 3 Shards walking out of the death spot with the wave's scaling; the shards pay their own gold, take ordinary hits, and the wave ends when they are done; a leaked Fracture never splits.
- [ ] The first split shows "it splits when it dies" once at the death spot; the trefoil token is a new shape in purple at size 0.5 with two live cracks that deepen with damage; no other token, sound or HUD element changes.
- [ ] Unit tests for the wave-100 plan and the split rule (shard count, wave scaling, no split on a leak); content validation for the new fields; the runChecks invariants (the Fracture's spawnOnly slot, the boss plan's wave-100 case); `npm run check` and the desktop + mobile smoke pass.
