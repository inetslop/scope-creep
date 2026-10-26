---
id: T0031
title: Add the Dynamics upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T21:07:50Z
---

## Goal
A second trade-off card: Dynamics buys raw damage with move speed, so damage builds get a glass-cannon option alongside Allegro's fire-rate-for-speed trade.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `allegro` entry is the closest example: two mods, one of them a move-speed penalty). Append after whatever entry is last — T0029 (Ostinato) may land first and be the new last entry.
- Values: `id: 'dynamics'`, `name: 'Dynamics'`, `description: '+20% damage, -8% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow`.
- `mods`: two mods — copy the damage mod from the `weight` entry (same stat, same op) with value 1.20, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value 0.92.
- At 3 levels: ≈ ×1.73 damage, ≈ ×0.78 move speed.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Dynamics up to 3 times; each level multiplies damage by 1.20 and move speed by 0.92 (3 levels ≈ ×1.73 damage, ≈ ×0.78 move speed)
- [ ] It stacks normally with Weight, Emphasis and Momentum
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` entry to the end of the `UPGRADES` array (after the `allegro` entry, or after `ostinato` if T0029 landed first). No other file changes.

### Interfaces
No new types. The entry must satisfy the existing `UpgradeDef` (`src/content/types.ts:126`):

```ts
  {
    id: 'dynamics',
    name: 'Dynamics',
    description: '+20% damage, -8% move speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'damageMul', op: 'mul', value: 1.2 },
      { stat: 'moveSpeed', op: 'mul', value: 0.92 },
    ],
    color: PALETTE.yellow,
  },
```

### Steps
1. Open `src/content/upgrades/index.ts`. Find the last entry in the `UPGRADES` array (currently `allegro`, ending at line 194; if T0029 landed first it will be `ostinato`).
2. Insert the exact entry above after that last entry, keeping the 2-space indent and the trailing comma, before the closing `];` on line 195.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do not change any existing entry, and do not re-sort the array — append only. T0029 appends to the same array; if both edits are pending, put `dynamics` after whatever is currently last.
- Both mods are `op: 'mul'` (copy `weight`'s damage mod and `momentum`'s move-speed mod). A `add` on `moveSpeed` would be wrong and would not produce the ×0.78 at 3 levels.
- `1.2` and `1.20` are the same number; write `1.2` to match the file's style. `mul` values must be > 0 (content test enforces this).
- `moveSpeed` clamps to min 60 in `STAT_LIMITS` — 230 × 0.92³ ≈ 179, so no clamping interference.
- `id: 'dynamics'` must stay unique kebab-case or `tests/content.test.ts` fails.

### Tests
- none — `tests/content.test.ts` validates the new entry automatically (id, maxLevel, weight, stats, mul > 0); per-level math is already covered by the existing `computeStats`/`applyUpgrade` behavior.
