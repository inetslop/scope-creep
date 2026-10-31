---
id: T0006
title: "Chomp: a Body capstone, heal on kill"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T02:20:47Z
epic: E1
---

## Goal
The Body tree gets its capstone behind a real commitment: the tank that stands in the crowd eats its way back — every kill heals. Body stops being a bag of stats and becomes a playstyle: stand your ground, kill, stay alive.

## Details
- New upgrade file `src/content/upgrades/chomp.ts` (closest example: `src/content/upgrades/ricochet.ts`, an effect that runs on the player's weapons; Chomp is an on-kill with `maxLevel: 1` — a capstone, like Ricochet's talent line).
- On kill: killing a monster heals 5 hp (up to max hp); knocking out a player heals 25 hp. A kill by any weapon or area counts, at any rank of it.
- Talent line in the Body tree file (closest example: the `vigor` line in the same file): id `chomp`, upgrade `chomp`, max 1, needs `[["vigor", 3], ["swift", 3]]` — the toughness and the speed that let you stand still, then the capstone on top.
- Text (shown on its talent line, must fit at 412x915): "On kill: heal 5 hp. On a player knockout: heal 25."
- Look: shape pentagon, color green.
- What it costs: 6 points in one fixed shape (Vigor 3 and Swift 3) before the capstone's own point — 7 of Body's 19 points once Chill is in, a real commitment: those same points could instead buy full Might (hit harder) or a full Chill (slow deeper).
- What it does in a crowd: a Body build with Might in a thick crowd kills several monsters a second; 5 hp per kill is steady health back while the crowd bites, so leaning into a wave becomes survivable instead of a death sentence, and a player knockout pays 25 hp on top of its xp and score — a fight with another player heals you for the seconds after.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an effect that runs on the player's weapons | Ricochet runs on a hit and bounces the bolt to another enemy; Chomp runs on a kill and heals the killer — it changes how long you can stand in a crowd, not how your shots land |
| Fuse (T0003, in the pool) | an on-kill effect | Fuse pops a damage ring around the corpse (more kills); Chomp heals the player who killed (more staying power) |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a capstone line "Chomp" under Vigor: "On kill: heal 5 hp. On a player knockout: heal 25.", pentagon icon (green), 1 rank, "Needs Vigor 3, Swift 3" until taken — readable at 412x915.
- [ ] With Chomp, killing a monster heals the player 5 hp (up to max): a player who would have been knocked out by the next touch of the crowd keeps fighting.
- [ ] Knocking out a player heals the killer 25 hp, on top of the knockout's xp and score.
- [ ] Without Chomp, kills heal nothing (only the player's own regen); the Body tree's other talents are unchanged.
