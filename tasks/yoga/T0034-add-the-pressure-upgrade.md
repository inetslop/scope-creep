---
id: T0034
title: Add the Pressure upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T21:54:06Z
claimed_at: 2026-10-26T21:55:05Z
finished_at: 2026-10-26T22:00:56Z
---

## Goal
A new level-up card for the "hit hard and often" build — a pure damage + fire-rate combo that reuses two existing stats, no new mechanics.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'pressure'`, `name: 'Pressure'`, `description: '+10% damage, +10% fire rate'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.orange`.
- `mods`: two mods — copy the damage mod from the `emphasis` entry (same stat, same op) with value 1.10, and copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.10.
- At 3 levels: ×1.33 damage and ×1.33 fire rate (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Pressure up to 3 times; each level multiplies damage by 1.10 and fire rate by 1.10 (3 levels ≈ ×1.33 each)
- [ ] It stacks with Weight/Emphasis (damage) and Rhythm/Allegro (fire rate) normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one new entry to the end of the `UPGRADES` array (after the last entry currently in the file; `fugue` is the last one today, but if another entry has been appended by a concurrent task, append after that one instead)

### Interfaces
No new types or functions. The entry must be a valid `UpgradeDef` (already imported in the file):

```ts
  {
    id: 'pressure',
    name: 'Pressure',
    description: '+10% damage, +10% fire rate',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'damageMul', op: 'mul', value: 1.10 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.orange,
  },
```

### Steps
1. Open `src/content/upgrades/index.ts`. Copy the `fugue` entry (it has two mods, same shape) and change the fields to exactly the values above. Keep the same formatting (2-space indent, one mod per line, trailing comma, entry ends with `},` before the `];`).
2. Do not touch `UPGRADE_BY_ID` — it is built from `UPGRADES` automatically.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `stat` names must be exactly `damageMul` and `fireRateMul` (from `core/stats.ts`); `op` must be `'mul'` for both — a typo fails the typecheck and `tests/content.test.ts`.
- Do not add `requires`, `requiresWeapon`, or `grantsWeapon` — this upgrade must be freely available.
- No other file changes: the level-up roll, card rendering, and stat folding are all data-driven off `UPGRADES`.
- Stacking is safe: `computeStats` clamps `fireRateMul` to max 8 and `damageMul` to min 0.1, so extreme stacks clamp instead of breaking; 1.10³ = 1.331 ≈ ×1.33.

### Tests
- none — `tests/content.test.ts` already validates every `UPGRADES` entry (unique kebab-case id, maxLevel ≥ 1, weight > 0, known stats, mul > 0) and runs as part of `npm run check`.

## Result (attempt 1, yoga)

Added the Pressure upgrade to `UPGRADES` in `src/content/upgrades/index.ts` — a max-level-3, weight-4 card (orange) that multiplies damage and fire rate by 1.10 each, reaching ≈×1.33 at max level. It reuses the existing `damageMul`/`fireRateMul` stats, so it stacks normally with Weight/Emphasis and Rhythm/Allegro with no new code. Verified with `npm run check` (typecheck, lint, 109 unit tests) and `npm run smoke` (desktop + mobile), both passing.

- Self-review: APPROVE
- Time: 5.9 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 1 file changed, 12 insertions(+)
```
