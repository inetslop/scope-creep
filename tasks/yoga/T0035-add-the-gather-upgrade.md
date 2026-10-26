---
id: T0035
title: Add the Gather upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: [T0034]
attempts: 0
created: 2026-10-26T21:54:06Z
---

## Goal
A new level-up card for the "shard economy" build — pull shards in from farther away and make them worth more, so a greedy playstyle snowballs.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'gather'`, `name: 'Gather'`, `description: '+25% pickup radius, +15% shard XP'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow`.
- `mods`: two mods — copy the pickup-radius mod from the `gravity` entry (same stat, same op) with value 1.25, and copy the shard-XP mod from the `composition` entry (same stat, same op) with value 1.15.
- At 3 levels: ×1.95 pickup radius and ×1.52 shard XP (1.25³ ≈ 1.95, 1.15³ ≈ 1.52).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Gather up to 3 times; each level multiplies shard pickup radius by 1.25 and shard XP by 1.15
- [ ] It stacks with Gravity (pickup radius) and Composition (shard XP) normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` entry to the end of the `UPGRADES` array (after the `fugue` entry, before the closing `];` at line 231). No other file changes.

### Interfaces
No new types or functions. `pickupRadius` and `xpMul` already exist in `PlayerStats`/`BASE_STATS`/`STAT_LIMITS` (`src/core/stats.ts`); `computeStats()` folds all mods, and `src/core/upgrades.ts:6` enforces `maxLevel` generically — stacking with Gravity and Composition works automatically. `PALETTE.yellow` already exists (used by `composition`, `plate`, `dynamics`).

### Steps
1. In `src/content/upgrades/index.ts`, insert this entry immediately after the `fugue` entry's closing `},` (line 230), keeping the array's trailing-comma style:
```ts
  {
    id: 'gather',
    name: 'Gather',
    description: '+25% pickup radius, +15% shard XP',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'pickupRadius', op: 'mul', value: 1.25 },
      { stat: 'xpMul', op: 'mul', value: 1.15 },
    ],
    color: PALETTE.yellow,
  },
```
2. Run `npm run check` — must pass.
3. Run `npm run smoke` — must pass.

### Pitfalls
- Append only: do not alter `fugue` or any existing entry, and do not touch the `UPGRADE_BY_ID` line.
- `id: 'gather'` is unique (verified — no existing entry uses it); keep it kebab-case or `tests/content.test.ts` fails.
- Both mod values must be written as `1.25` and `1.15` exactly (mul ops, > 0); do not "fix" the description to match Gravity/Composition wording — use the exact string above.
- T0034 (Pressure) also appends to this same array; do T0034 first (or re-apply this entry after it) to avoid a merge conflict.

### Tests
- none — `tests/content.test.ts` already validates every `UPGRADES` entry generically (unique id, valid stats, mul > 0, maxLevel/weight, "must do something").
