---
id: T0018
title: Add the Staccato upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T19:44:48Z
claimed_at: 2026-10-26T19:49:48Z
---

## Goal
A new speed build for players: bullets leave the gun faster AND fly faster — the missing link between Rhythm (fire rate only) and Draft (projectile speed only).

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others. The `draft` entry (added in T0012) is the closest model; the `tempo` entry shows how an entry with two mods is written.
- Values: `id: 'staccato'`, `name: 'Staccato'`, `description: '+12% fire rate, +12% projectile speed'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods, in this order — first the fire-rate mod the `rhythm` entry uses (`op: 'mul'`, value 1.12), then the `projectileSpeedMul` mod the `draft` entry uses (`op: 'mul'`, value 1.12).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu can offer Staccato up to 3 times; each level makes firing measurably faster and projectiles measurably faster
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one `UpgradeDef` entry to the end of the `UPGRADES` array, after the `draft` entry (which ends at line 133) and before the `];` on line 134. No other file changes.

### Interfaces
No new types or functions. The entry uses the existing `UpgradeDef` (`src/content/types.ts:110`) and existing stats `fireRateMul` / `projectileSpeedMul` (`src/core/stats.ts:22,24`), both already read in `src/systems/WeaponSystem.ts:37` (fire rate) and `:69` (projectile speed).

### Steps
1. In `src/content/upgrades/index.ts`, insert exactly this block after the closing `},` of the `draft` entry (line 133), keeping 2-space indentation and the same field order as the other entries:
```ts
  {
    id: 'staccato',
    name: 'Staccato',
    description: '+12% fire rate, +12% projectile speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'fireRateMul', op: 'mul', value: 1.12 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.12 },
    ],
    color: PALETTE.orange,
  },
```
2. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Do not touch any other entry or the `UPGRADE_BY_ID` line at the bottom — it is derived from `UPGRADES` automatically.
- Mod order matters per spec: `fireRateMul` first, `projectileSpeedMul` second (computeStats applies all muls, so order is cosmetic, but keep it exact).
- `PALETTE` is already imported at the top of the file; do not add imports.
- T0013 and T0016 also append to this same array — if their changes land first, re-append after whatever the new last entry is; there is no functional dependency, only a merge-order concern.

### Tests
- none — `tests/content.test.ts` (unique kebab-case ids, valid stats, `mul > 0`) and `tests/core/core.test.ts:102-103` (applies every upgrade to maxLevel, expects the offer pool to exhaust) already cover the new entry.
