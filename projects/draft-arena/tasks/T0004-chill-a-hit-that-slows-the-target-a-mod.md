---
id: T0004
title: "Chill: a hit that slows the target, a mod for any weapon"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T02:20:47Z
epic: E1
---

## Goal
The Body tree gets its crowd tool: every hit slows the critter it hits, so a tank can stand in the wave, slow it, and eat it instead of outrunning it. A new on-hit effect (the first besides Ricochet) and the first slow status a player's weapons put on a critter.

## Details
- New upgrade file `src/content/upgrades/chill.ts` (closest example: `src/content/upgrades/ricochet.ts`, an on-hit effect). On hit: apply a slow to the critter hit — its speed × (1 − slow) until the time runs out. The slow never stacks: a fresh hit refreshes the time; the slow % is the current rank's.
- Exact numbers: rank 1: 30% slow for 1.0 s; per rank +10% slow and +0.5 s (rank 2: 40% / 1.5 s, rank 3: 50% / 2.0 s).
- Talent line in the Body tree file (closest example: the `vigor` line in the same file): id `chill`, upgrade `chill`, max 3, needs `[["vigor", 1]]` — the slow is bought into the tank line, not free: a slow with no hp behind it to stand still is a death sentence.
- Text (shown on its talent line, must fit at 412x915): "Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s."
- Look: shape hexagon, color ice.
- What it does with every weapon: Bolt — every bolt hit slows the critter it hits; with Split, every fanned bolt refreshes it; with Lance, every critter in the line is slowed; with Ricochet, the bounce hit refreshes it. General rule for all weapons: it works with anything that hits, and an area refreshes it on every pulse for everything inside (so the Lobber's splash, T0003, slows a whole circle).
- What it does to a player: a hit enemy player is slowed the same way — a fleeing or charging player at 50% speed is a catch; in a player chase the slow is the difference between a catch and a get-away.
- On the field, readable in a crowd: while slowed, the critter's face turns scared (mood change, its mouth closes to o) — an angry red Dot that becomes a scared red Dot reads as "slowed"; the face returns when the slow wears off. When a slow first lands (not on a refresh), a small ice bubble (radius 8, 0.3 s) pops off the critter — new effect file `src/content/effects/slow-pop.ts` (closest example: `src/content/effects/pop.ts`, the confetti pop).
- What it changes in a crowd: a Dot at 85 u/s crawls at 60 with Chill 1 — a player (210 u/s) steps out of a slowed Dot's reach easily; in a 60-strong wave the slowed chunk is room to move, and standing in it stops being a death sentence.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect of the player's weapons | Ricochet redirects the bolt to another enemy (a chain of damage); Chill changes the target itself — it moves slower for a time, so the crowd loses its chase |
| Fuse (T0003, in the pool) | an effect that runs on the player's weapons | Fuse runs on a kill and damages a ring around the corpse; Chill runs on every hit and slows the living target |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a new line "Chill" under Vigor: "Hits slow the target by 30% for 1 s. Per rank: +10% slower, +0.5 s.", hexagon icon (ice), 3 ranks, "Needs Vigor 1" until taken — readable at 412x915.
- [ ] With Chill 1, a hit Dot crawls at 70% speed for 1.0 s, then is normal again; a running player (210 u/s) easily gets out of a slowed Dot's reach.
- [ ] A hit enemy player is slowed the same way: 30% slower for 1.0 s at rank 1.
- [ ] While slowed, the critter's face is scared and returns when the slow wears off; a small ice bubble pops off when the slow first lands, and a refresh within the time extends the duration without popping again.
- [ ] At rank 3 the slow is 50% for 2.0 s.
- [ ] Without Chill, hits slow nothing: Dot and Puff are unchanged.
