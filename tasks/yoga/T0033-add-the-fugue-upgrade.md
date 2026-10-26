---
id: T0033
title: Add the Fugue upgrade
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T21:23:27Z
---

## Goal
A new level-up card for the "hit harder, faster" build — a pure stat combo that reuses two existing stats, no new mechanics.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `ostinato` entry is the closest example: two mods).
- Values: `id: 'fugue'`, `name: 'Fugue'`, `description: '+15% damage, +15% projectile speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.ink`.
- `mods`: two mods — copy the damage mod from the `emphasis` entry (same stat, same op) with value 1.15, and copy the projectile-speed mod from the `draft` entry (same stat, same op) with value 1.15.
- At 3 levels: ×1.52 damage and ×1.52 projectile speed (1.15³ ≈ 1.52).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Fugue up to 3 times; each level multiplies damage by 1.15 and projectile speed by 1.15 (3 levels ≈ ×1.52 each)
- [ ] It stacks with Weight/Emphasis and Draft/Staccato normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one new entry to the end of the `UPGRADES` array (after the `dynamics` entry, before the closing `];`). No other file changes.

### Interfaces
No new types. Uses existing `UpgradeDef` (`src/content/types.ts:128`), existing stats `damageMul` and `projectileSpeedMul` (`src/core/stats.ts:20,24`), existing `PALETTE.ink` (`src/content/palette.ts:9`).

### Steps
1. Open `src/content/upgrades/index.ts`. Find the `dynamics` entry (the last one, ending at line 218 with `},`).
2. Immediately after that `},` and before `];`, insert exactly:

```ts
  {
    id: 'fugue',
    name: 'Fugue',
    description: '+15% damage, +15% projectile speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'damageMul', op: 'mul', value: 1.15 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.15 },
    ],
    color: PALETTE.ink,
  },
```

3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Append only — do not modify any existing entry, and do not touch `UPGRADE_BY_ID` (line 221) or imports; `PALETTE` is already imported.
- Both mod values are `1.15`. The `draft` entry you copy the stat name from uses `1.25` — do not carry that number over.
- `id: 'fugue'` is unique and kebab-case; `tests/content.test.ts` enforces this automatically.
- No system/scene changes needed: `RunState.applyUpgrade()` folds these mods and systems read `run.stats` every frame; `rollUpgradeChoices` (`src/core/upgrades.ts:6`) already respects `maxLevel: 3`, so it is offered up to 3 times and stacks with Weight/Emphasis and Draft/Staccato via the normal `mul` fold.

### Tests
- none (the existing `tests/content.test.ts` upgrade validation covers the new entry: id, name/description, maxLevel, weight, and that both mod stats exist with `mul` values > 0).
