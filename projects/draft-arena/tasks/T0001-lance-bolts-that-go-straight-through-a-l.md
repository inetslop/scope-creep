---
id: T0001
title: "Lance: bolts that go straight through a line of monsters"
assignee: desktop-4070
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T01:44:04Z
claimed_at: 2026-10-31T02:04:48Z
epic: E1
---

## Goal
A Gunner can punch a bolt through a line of monsters — each shot goes through 1 more enemy per rank, at full damage. A new way to focus a crowd (a line, not a fan), and the first upgrade that raises the pierce stat.

## Details
- New upgrade file `src/content/upgrades/lance.ts` (closest example: `src/content/upgrades/split.ts`, a small stats mod).
- New talent line in the Gunner tree file (closest example: the `haste` line in the same file): id `lance`, upgrade `lance`, max 2, no needs. The tree gains a second base talent beside Haste, so players now fork early: Haste (shots sooner) or Lance (shots that go through).
- The upgrade: stats mod, `pierce +1` per rank, `maxLevel: 2`. A bolt keeps full damage on every enemy it passes through (rank 2: a bolt hits up to 3 monsters in a straight line).
- Text (shown on its talent line, must fit at 412x915): "Bolts go through 1 more enemy, per rank."
- Look: shape diamond, color blue.
- What it does with every weapon: Bolt — bolts pass through 1 more enemy per rank; a bolt that hits a player also continues on to the next enemy behind it (players take half damage, as usual). General rule for future weapons: it works with any weapon that fires projectiles; it has no effect on weapons that lay areas (splashes), since a splash already hits everything in its circle.
- Combos: with Split, every fanned shot pierces, so a spread of shots cuts lines of monsters; with Ricochet, a bolt can bounce off the last enemy in the line it went through.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Split | hits more than one enemy with the same weapon | Split adds weaker fanned-out shots; Lance adds no shots — each shot you already fire keeps full damage through 1 more enemy in a straight line |
| Ricochet | a bolt keeps hitting after a hit | Ricochet bounces off at an angle to another enemy nearby (a chain); Lance goes straight through the enemy it hit (a line) and the bolt keeps full damage |

## Acceptance criteria
- [ ] The Gunner tab in the talents panel has a new base line "Lance": "Bolts go through 1 more enemy, per rank.", diamond icon (blue), 2 ranks, no needs — readable at 412x915.
- [ ] At rank 1, a bolt that hits a monster keeps going straight and hits a second monster behind it at full damage.
- [ ] At rank 2, a bolt hits up to 3 monsters in a line.
- [ ] A bolt that hits a player also continues on to the next enemy behind it (player takes half damage, as usual).
- [ ] Without Lance, the Bolt is unchanged: a bolt stops at the first enemy it hits.
- [ ] The Gunner tree keeps its shape: Haste and Lance both need nothing; Bolt still needs Haste 1; Split and Ricochet are untouched.

## Design (architect, yoga)

### Files
- create `src/content/upgrades/lance.ts` — the `lance` `UpgradeDef` (a pierce stat mod, same shape as `split.ts`)
- edit `src/content/upgrades/index.ts` — one import line + one `UPGRADES` line
- edit `src/content/talents/gunner.ts` — one talent line

### Interfaces
None — plain `UpgradeDef` data, no new types. `stats: { pierce: 1 }` uses the existing `Stats.pierce` key (engine/api.ts:182, "Added to the pierce of every projectile you fire").

### Steps
1. Create `src/content/upgrades/lance.ts` exactly:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const lance: UpgradeDef = {
  id: 'lance',
  name: 'Lance',
  description: 'Bolts go through 1 more enemy, per rank.',
  maxLevel: 2,
  look: { shape: 'diamond', color: PALETTE.blue },
  stats: { pierce: 1 },
};
```
   No `fire`/`cooldown`/`onHit` — a pure stat mod, exactly like `split.ts`. The engine applies `pierce` to every projectile a player fires, so it works with Bolt and any future projectile weapon, not areas.
2. In `src/content/upgrades/index.ts`: add `import { lance } from './lance.ts';` after the `haste` import (keep alphabetical), and `  lance,` after `  split,` (stats section, beside the other projectile mod).
3. In `src/content/talents/gunner.ts`, after the `haste` line add exactly: `    { id: 'lance', upgrade: 'lance', max: 2 },`. No `needs`, no `start` — it is a base talent beside Haste. Do not touch the `bolt`, `split` or `ricochet` lines.

### Pitfalls
- The text on its talent line is the upgrade's `description` (shown by the panel, as for every talent): 41 chars, well under `split`'s 71-char description that already fits at 412x915 — the Gunner tab's fullest state is 5 lines (Haste, Bolt, Split, Ricochet, Lance), no layout work needed.
- `pierce: 1` is per level, not `+1`: rank 1 → pierce 1 (bolt hits 2 in a line), rank 2 → pierce 2 (hits 3). Do not write `pierce: 2` — that would fail rank-1 acceptance.
- No `needs` on the talent line (a needs-less line must not get one); `max: 2` must stay ≤ `maxLevel: 2`.
- No face on `look` (it is a talent icon, like `split`); no draw function needed.
- One item per file: `lance.ts` holds only `lance`.

### Tests
none (engine/tests/ checks every upgrade and talent automatically, including real-match runs and talent reachability).
