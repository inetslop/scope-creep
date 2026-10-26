---
id: T0026
title: Add the Allegro upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:32:24Z
claimed_at: 2026-10-26T20:40:20Z
---

## Goal
The first trade-off upgrade: Allegro buys fire rate with move speed, so aggressive builds make a real choice at level-up instead of pure stacking.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'allegro'`, `name: 'Allegro'`, `description: '+15% fire rate, -8% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- `mods`: two mods — copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.15, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value 0.92.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Allegro up to 3 times, and each level multiplies fire rate by 1.15 and move speed by 0.92 (3 levels ≈ ×1.52 fire rate, ×0.78 move speed)
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` entry to the end of the `UPGRADES` array (after the `emphasis` entry, before the closing `];` on line 173). No other file changes.

### Interfaces
No new types. The entry must satisfy the existing `UpgradeDef` (`src/content/types.ts:110`) with these exact values:

```ts
  {
    id: 'allegro',
    name: 'Allegro',
    description: '+15% fire rate, -8% move speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'fireRateMul', op: 'mul', value: 1.15 },
      { stat: 'moveSpeed', op: 'mul', value: 0.92 },
    ],
    color: PALETTE.red,
  },
```

### Steps
1. Open `src/content/upgrades/index.ts`. Copy the block above verbatim and paste it after the `emphasis` entry (line 172), keeping the 2-space indent and trailing comma exactly like the neighbors.
2. Run `npm run check` (typecheck + lint + tests/content.test.ts validates the new entry automatically: kebab-case unique id, maxLevel ≥ 1, weight > 0, both stats exist in `BASE_STATS`, mul values > 0).
3. Run `npm run smoke`.

### Pitfalls
- Stats and flow are already wired: `computeStats()` (`src/core/stats.ts:74`) folds all `mul` mods, and `RunState.applyUpgrade()` (`src/core/run.ts:73`) pushes `def.mods` once per level, so 3 levels = ×1.15³ ≈ 1.52 fire rate, ×0.92³ ≈ 0.78 move speed. `isUpgradeAvailable()` (`src/core/upgrades.ts:5`) stops offering it at `maxLevel` 3. Do not write any code to "make it work" — data only.
- `0.92` passes the content test's `mul value > 0` check; do not write `-0.08` with `op: 'add'`.
- Limits are safe: 230 × 0.92³ ≈ 179 > `moveSpeed` min 60; 1.15³ ≈ 1.52 < `fireRateMul` max 8.
- T0022 and T0024 also append to this same array. If either landed first, re-check the entry still sits at the end with a unique id (the content test catches duplicates) — but this task does not depend on them.
- Do not touch `UPGRADE_BY_ID` (line 175); it derives from the array automatically.

### Tests
- none — `tests/content.test.ts` covers the new entry automatically.
