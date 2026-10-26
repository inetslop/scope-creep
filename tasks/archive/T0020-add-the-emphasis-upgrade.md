---
id: T0020
title: Add the Emphasis upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0016]
attempts: 1
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:06:26Z
finished_at: 2026-10-26T20:12:17Z
---

## Goal
A second, slower damage ramp so damage builds have room to grow past Weight.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'emphasis'`, `name: 'Emphasis'`, `description: '+15% damage'`, `maxLevel: 5`, `weight: 5`, `color: PALETTE.ink`.
- `mods`: a single mod that multiplies the same damage stat that the `weight` entry uses — copy that entry's damage mod (same stat, same op) with value 1.15.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Emphasis up to 5 times, and each level multiplies damage by 1.15 (5 levels ≈ ×2.01 total)
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one entry to the end of the `UPGRADES` array (after the last entry, before the `];` on line 155). No other file changes; `UPGRADE_BY_ID` is built from `UPGRADES` automatically, and `core/upgrades.ts`/`core/run.ts` already handle `maxLevel` and `mods` generically.

### Interfaces
No new types or signatures. The entry is an existing `UpgradeDef` (src/content/types.ts:110) with the exact values from the task.

### Steps
1. Re-read `src/content/upgrades/index.ts` first — T0016 (in progress) appends to the same array, so the last entry may no longer be `staccato`. Append after whatever entry is last.
2. Append exactly this entry (2-space indent, same field order as the others):
```ts
  {
    id: 'emphasis',
    name: 'Emphasis',
    description: '+15% damage',
    maxLevel: 5,
    weight: 5,
    mods: [{ stat: 'damageMul', op: 'mul', value: 1.15 }],
    color: PALETTE.ink,
  },
```
3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- `stat` must be `damageMul` (the same stat the `weight` entry uses) and `op` must be `mul` with `value: 1.15` — not `add`, not 15.
- The field `weight: 5` is the roll chance; it is unrelated to the existing upgrade id `'weight'`. Do not add a `requires` field.
- `PALETTE` is already imported in this file — do not add an import.
- Do not edit `UPGRADE_BY_ID` or any other file. 1.15^5 ≈ 2.01; `damageMul` has no max limit in `STAT_LIMITS`, so 5 levels stack fine.

### Tests
- none — `tests/content.test.ts` already validates every entry in `UPGRADES` (unique kebab-case id, maxLevel ≥ 1, weight > 0, stat exists in `BASE_STATS`, mul value > 0, does something), and it runs as part of `npm run check`.

## Result (attempt 1, yoga)

Added the Emphasis upgrade to the end of the `UPGRADES` array in `src/content/upgrades/index.ts` — a size-S damage ramp (`+15% damage` per level, max 5 levels, roll weight 5, ink color) that multiplies the same `damageMul` stat as the existing Weight upgrade, so 5 levels stack to ≈×2.01 damage. `UPGRADE_BY_ID` picks it up automatically and the content tests validate it; `npm run check` (typecheck + lint + 55 tests) and `npm run smoke` (desktop + mobile browser play) both pass.

- Self-review: APPROVE
- Time: 5.9 min

```
game/src/content/upgrades/index.ts | 9 +++++++++
 1 file changed, 9 insertions(+)
```
