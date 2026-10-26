---
id: T0037
title: Add the Accent upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:45:39Z
---

## Goal
A crit-focused build. The "Accent" card raises both crit chance and damage, so stacking it with Contrast builds a real crit build — one of the few non-raw-DPS directions in the pool.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'accent'`, `name: 'Accent'`, `description: '+5% crit chance, +10% damage'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- `mods`: two mods — copy the crit-chance mod from the `contrast` entry (same stat, same op) with value `0.05`, and copy the damage mod from the `emphasis` entry (same stat, same op) with value `1.10`.
- At 3 levels: +15% crit chance and ×1.33 damage (1.10³ ≈ 1.33).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Accent up to 3 times; each level adds +5% crit chance and multiplies damage by 1.10
- [ ] It stacks with Contrast (crit chance) and Weight/Emphasis (damage) normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one `UpgradeDef` entry to the end of the `UPGRADES` array (after the `gather` entry, before the closing `];`). Nothing else changes.

### Interfaces
No new types or functions. Both stats already exist in `PlayerStats` (`src/core/stats.ts:19,32`): `damageMul` (mul) and `critChance` (add, clamped 0–0.5). The offer roll (`src/core/upgrades.ts`), stat folding (`Run.applyUpgrade`, `src/core/run.ts:88`), and damage/crit application (`CombatSystem`, `OrbitSystem`, `ArcSystem`) are all generic over `UPGRADES` — no code changes needed.

### Steps
1. Open `src/content/upgrades/index.ts`. After the `gather` entry (ends line 254), insert exactly this, matching the file's 2-space indent and trailing-comma style:

```ts
  {
    id: 'accent',
    name: 'Accent',
    description: '+5% crit chance, +10% damage',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'critChance', op: 'add', value: 0.05 },
      { stat: 'damageMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.red,
  },
```

2. Verify: `id` 'accent' is unique and kebab-case; `PALETTE.red` is already imported at the top of the file (line 1); `UPGRADE_BY_ID` is derived automatically — do not touch it.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Insert at the end of the array only; do not reorder or edit existing entries (other tasks touch other files, not this array).
- Use `op: 'add'` for critChance (copy of `contrast`, line 150) and `op: 'mul'` for damageMul (copy of `emphasis`, line 180) — swapping the ops silently breaks the build.
- Write `1.10` (matches the existing `pressure` entry, line 238); do not "simplify" to `1.1`.
- Do not add a new stat, invariant, or scene — this is pure data. 3 levels = +0.15 crit (under the 0.5 cap) and 1.10³ ≈ 1.331 damage, so no clamp interaction.

### Tests
- none — `tests/content.test.ts` (lines 91–108) automatically validates every `UPGRADES` entry: unique kebab-case id, non-empty name/description, integer `maxLevel ≥ 1`, `weight > 0`, stats exist in `BASE_STATS`, mul values > 0.

DEPENS_ON: none
