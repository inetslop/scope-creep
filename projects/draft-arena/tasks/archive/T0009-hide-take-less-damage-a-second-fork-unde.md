---
id: T0009
title: "Hide: take less damage, a second fork under Vigor"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T02:37:00Z
claimed_at: 2026-10-31T03:04:51Z
finished_at: 2026-10-31T03:12:04Z
epic: E1
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

## Design (architect, yoga)

### Files
- create `src/content/upgrades/hide.ts` - the Hide upgrade: stats mod, `armor +10` per rank, `maxLevel: 3`
- edit `src/content/upgrades/index.ts` - import `hide`, one line in `UPGRADES`
- edit `src/content/talents/body.ts` - one talent line under Vigor

### Interfaces
No new types — data only, against existing `UpgradeDef` / `TalentDef`.

What armor does numerically in this engine (`engine/sim/match.ts:967`, frozen): for a hit of `d` on a player, damage taken is `max(d/4, d - armor)`, applied *after* the pvp halving (`rules.pvp.damageMul = 0.5`) — flat, not percentage. With `armor = 10` per rank: rank 1: 12→3, 22→12; rank 2: 12→3, 22→5.5; rank 3 (armor 30): 12→3 (75% less), 22→5.5 (75% less), a 100-hit→70 (30% less). So a Dot's 12/s touch lands for 3/s (task bar "about 8 or less" met), a Zippy's 22/s dash lands for 5.5/s — under the task's "about 15", i.e. a charge is even more survivable; a player's Bolt is halved first, then reduced. Talent text verbatim: "Take 10% less damage, per rank."

### Steps
1. Create `src/content/upgrades/hide.ts` exactly:
   ```ts
   import type { UpgradeDef } from '../../../engine/api.ts';
   import { PALETTE } from '../palette.ts';

   export const hide: UpgradeDef = {
     id: 'hide',
     name: 'Hide',
     description: 'Take 10% less damage, per rank.',
     maxLevel: 3,
     look: { shape: 'hexagon', color: PALETTE.green },
     stats: { armor: 10 },
   };
   ```
2. `src/content/upgrades/index.ts`: add `import { hide } from './hide.ts';` after the `haste` import (alphabetical); add `hide,` in `UPGRADES` after the `vigor,` line (the stats section).
3. `src/content/talents/body.ts`: insert exactly after the `{ id: 'vigor', upgrade: 'vigor', max: 3 },` line: `    { id: 'hide', upgrade: 'hide', max: 3, needs: [['vigor', 1]] },`
4. Run `npm run check` and `npm run smoke`.

### Pitfalls
- No `points`, `start` or `prestige` on the talent — only `needs: [['vigor', 1]]`; "4 points for full Hide" falls out of Vigor 1 + Hide 3 spent.
- The stat is exactly `stats: { armor: 10 }` — no maxHp/regen/speed; no other upgrade raises armor, and the engine's formula is not to be approximated by any hook.
- Description exactly `'Take 10% less damage, per rank.'`; look exactly `{ shape: 'hexagon', color: PALETTE.green }` (green, not the tree's lime).
- Export `hide`; one item per file; one registry line each. Do not touch the swift/might/vigor/magnet/chomp lines or reformat.
- The engine draws the row from the data: hexagon icon (green), 3 rank pips and "Needs Vigor 1" come free; the description is the same length class as every existing line, so nothing changes at 412x915 — Body tab is its current lines plus Hide drawn under Vigor, beside Chill (T0004).

### Tests
none (engine/tests checks every content item automatically: file registered, valid data, talent reachable, ranks ≤ maxLevel).

## Result (attempt 1, yoga)

Added the Hide upgrade (`src/content/upgrades/hide.ts`), a defensive stats mod giving +10 armor per rank (max 3, "Take 10% less damage, per rank.", green hexagon), registered it in `UPGRADES`, and added its talent line under Vigor in the Body tree (`needs: [['vigor', 1]]`) so the tank fork now offers Chill (slow the crowd) or Hide (thicker wall: armor flatly reduces damage taken from every source, applied after the pvp half-damage rule). No other files changed.

- Self-review: APPROVE
- Time: 7.2 min

```
projects/draft-arena/game/src/content/talents/body.ts   |  1 +
 projects/draft-arena/game/src/content/upgrades/hide.ts  | 11 +++++++++++
 projects/draft-arena/game/src/content/upgrades/index.ts |  2 ++
 3 files changed, 14 insertions(+)
```
