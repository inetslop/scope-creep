---
id: T0051
title: Add the Glissando upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T00:32:39Z
claimed_at: 2026-10-27T01:34:14Z
---

## Goal
A new economy-DPS level-up card that reuses two existing stats, added as one entry in the upgrade table.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tessitura entry).
- `id: 'glissando'`, display name "Glissando", description `'+15% shard XP, +10% fire rate'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow`.
- Two mods, copied from existing entries:
  - the shard-XP mod from the `gather` entry (same stat and op) with value 0.15 (+15% shard XP per level),
  - the fire-rate mod from the `rhythm` entry (same stat and op) with value 0.10 (+10% fire rate per level).
- At max level: ×1.52 shard XP and ×1.33 fire rate; stacks with other cards that use the same stats (Composition, Gather, Rhythm, Tempo, …).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tessitura`/`trill` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Glissando" appears as a yellow level-up card in the three-card choice, reading "+15% shard XP, +10% fire rate".
- [ ] Picking it raises shard XP by 15% and fire rate by 10% per level; at 3 levels, ×1.52 shard XP and ×1.33 fire rate.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` entry (id `glissando`) at the end of `UPGRADES`, after the `tessitura` entry, before the closing `];`
- edit `tests/core/upgrades.test.ts` - append one `it(...)` block after the `tessitura` test

### Interfaces
No new types or signatures. `UpgradeDef` (`src/content/types.ts:137`) and `StatMod` (`src/core/stats.ts:37`) are reused unchanged; the level-up scene offers cards data-driven from `UPGRADES`, so no scene change is needed.

### Steps
1. In `src/content/upgrades/index.ts`, insert exactly this entry after the `tessitura` entry (keep 2-space indent, one entry per 13 lines):
```ts
  {
    id: 'glissando',
    name: 'Glissando',
    description: '+15% shard XP, +10% fire rate',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.yellow,
  },
```
2. In `tests/core/upgrades.test.ts`, insert exactly this test after the `tessitura` test:
```ts
  it('glissando offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('glissando')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('glissando')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check` then `npm run smoke`.

### Pitfalls
- The task text's "value 0.15 / 0.10" are percentages, NOT the mod `value`. Mods are multipliers: `xpMul` must be `1.15` (as in `gather`) and `fireRateMul` `1.10` (as in `rhythm`). Writing `0.15`/`0.10` would mean 15% total XP per level and fail the test and the ×1.52/×1.33 acceptance.
- Do not rename the stats (`xpMul`, `fireRateMul`) or change the order of `mods` — the test asserts the exact array in the order shown.
- Only two files; do not touch `UPGRADE_BY_ID`, `tests/content.test.ts` (validates the new entry automatically), or any scene/system.

### Tests
- `tests/core/upgrades.test.ts`: the `glissando offers 3 levels, then stops` test above (exact mods ×1.15/×1.10, available for 3 picks, then unavailable).
