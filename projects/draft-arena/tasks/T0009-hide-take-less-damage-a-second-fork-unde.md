---
id: T0009
title: "Hide: take less damage, a second fork under Vigor"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T02:37:00Z
claimed_at: 2026-10-31T02:47:43Z
epic: E1
designer: yoga
---

## Goal
Body gets a second toughness fork: instead of slowing the crowd (Chill), thicken your hide and simply take less damage. Armor — a stat no upgrade raises yet — becomes a real build choice.

## Details
- New upgrade file `src/content/upgrades/hide.ts` (closest example: `src/content/upgrades/swift.ts`, a stats mod). Stats mod: `armor +10` per rank, `maxLevel: 3`. The design section states what armor does numerically in this engine; the target is 10% less damage taken per rank — at rank 3 (armor 30) a Dot's full touch (12 per second) lands for about 8 per second or less.
- Text (shown on its talent row, must fit at 412x915): "Take 10% less damage, per rank."
- Look: shape hexagon, color green.
- Talent line in the Body tree file (closest example: the `magnet` line in `src/content/talents/body.ts`): id `hide`, upgrade `hide`, max 3, needs `[["vigor", 1]]` — under the same Vigor as Chill (T0004), so the tank line forks: slow the crowd, or take less damage.
- It is defensive: it changes what you take, not what your weapons do. It applies to damage from anything — Dot touches, a Zippy's dash, an enemy's splash, an enemy's Bolt (the half-damage rule against players applies first, as usual). No other upgrade raises the armor stat.
- What it costs: 1 point in Vigor before the first Hide; 4 points for full Hide (Vigor 1, Hide 3) — the same 4 points could buy Chill 3 (deeper slows) or start the Chomp commitment (Vigor 3, Swift 3).
- In play: a player with Hide 3 stands in a Dot wave about 40% longer than the same player without Hide (same hp, 30% less damage per second) — the seconds between "I die in the wave" and "I eat the wave"; against a player, a Zippy's dash (22 per second) lands for about 15 per second at rank 3, so a charge is survivable instead of a knockout.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Vigor | a Body stat that keeps you alive | Vigor adds the hp to survive hits (25 per rank, plus 0.8 regen); Hide makes each hit land smaller (10% less damage per rank) — Vigor is a bigger cup, Hide is a thicker wall |
| Chill (T0004, in the pool) | a fork under Vigor, a way to make the crowd less deadly | Chill changes the crowd — it moves 30-50% slower while slowed; Hide changes you — every hit on you lands smaller, slowed crowd or not |

## Acceptance criteria
- [ ] The Body tab in the talents panel has a line "Hide" under Vigor: "Take 10% less damage, per rank.", hexagon icon (green), 3 ranks, "Needs Vigor 1" until taken — readable at 412x915.
- [ ] A player with Hide 3 standing in one Dot takes visibly less damage per second than the same player without Hide (a full Dot touch of 12 per second lands for about 8 per second or less).
- [ ] Hide reduces damage from every source, including a player's Bolt (after the half-damage rule) and, once T0005 builds, a Zippy's dash (22 per second lands for about 15 per second at rank 3).
- [ ] Without Hide, damage taken is unchanged (a Dot still does 12 per second); the Body tree's other talents are unchanged.
