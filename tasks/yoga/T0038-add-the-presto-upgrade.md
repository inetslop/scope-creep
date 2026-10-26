---
id: T0038
title: Add the Presto upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0037]
attempts: 1
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:51:42Z
---

## Goal
An "everything is fast" build. The "Presto" card raises both projectile speed and move speed, so bullets arrive sooner and you close distance faster — a pure velocity build with no damage or fire-rate cost.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'presto'`, `name: 'Presto'`, `description: '+10% projectile speed, +10% move speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods — copy the projectile-speed mod from the `draft` entry (same stat, same op) with value `1.10`, and copy the move-speed mod from the `momentum` entry (same stat, same op) with value `1.10`.
- At 3 levels: ×1.33 projectile speed and ×1.33 move speed (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Presto up to 3 times; each level multiplies projectile speed and move speed by 1.10
- [ ] It stacks with Draft (projectile speed) and Momentum (move speed) normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one `presto` entry to the end of the `UPGRADES` array (after the `gather` entry, before the `];` at line 255). No other file in src/ changes.
- edit `tests/core/upgrades.test.ts` - add one small test (snippet below).

### Interfaces
No new types or functions. Pure data using the existing `UpgradeDef` (`src/content/types.ts:137`): `id`, `name`, `description`, `maxLevel`, `weight`, `mods: StatMod[]`, `color`. Both stats already exist in `PlayerStats`/`BASE_STATS` (`src/core/stats.ts`): `projectileSpeedMul` (used by `draft`) and `moveSpeed` (used by `momentum`). `PALETTE.orange` exists (`src/content/palette.ts:19`). `id: 'presto'` is unique — verified against all 24 existing entries.

### Steps
1. In `src/content/upgrades/index.ts`, insert this entry after the `gather` entry's closing `},` (line 254), before `];` — copy the two-mod shape from `fugue`, mod 1 from `draft` (line 141), mod 2 from `momentum` (line 42), both with value `1.10`:
```ts
  {
    id: 'presto',
    name: 'Presto',
    description: '+10% projectile speed, +10% move speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.orange,
  },
```
2. In `tests/core/upgrades.test.ts`, change the line-4 import to `import { isUpgradeAvailable, rollUpgradeChoices } from '../../src/core/upgrades';` and add inside the `describe` block:
```ts
  it('presto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('presto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('presto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Append only. Do not reorder or reformat existing entries; `UPGRADE_BY_ID` (line 257) derives from the array — don't touch it.
- If T0037 (Accent) lands first, the array end moves; append after whatever the last entry is then.
- Write `1.10` exactly (matches `ostinato`/`pressure` style; lint accepts it).
- Stacking and the 3-offer cap are automatic: `computeStats` folds all `mul` mods (so Draft/Momentum/Presto multiply together, 1.10³ ≈ 1.33), and `isUpgradeAvailable` stops offering at `maxLevel`. No system, scene, pooling, or input code is involved — nothing to clean up on shutdown.

### Tests
- `tests/core/upgrades.test.ts`: the presto test above (exact values + offered exactly 3 times). `tests/content.test.ts` already auto-validates the new entry (unique kebab-case id, real stats, mul > 0).
