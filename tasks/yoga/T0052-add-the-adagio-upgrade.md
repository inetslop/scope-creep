---
id: T0052
title: Add the Adagio upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: [T0051]
attempts: 0
created: 2026-10-27T00:32:39Z
---

## Goal
A new defensive-sustain level-up card — max HP plus steady regeneration — added as one entry in the upgrade table.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tessitura entry).
- `id: 'adagio'`, display name "Adagio", description `'+6 max HP, +0.5 HP/s regen'`.
- `maxLevel: 3`, roll `weight: 5`, `color: PALETTE.yellow`.
- Two mods, copied from existing entries:
  - the max-HP mod from the `tessitura` entry (same stat and op) with value 6 (+6 max HP per level),
  - the regen mod from the `balance` entry (same stat and op) with value 0.5 (+0.5 HP/s per level).
- At max level: +18 max HP and +1.5 HP/s regen; stacks with Mass, Plate, Tessitura and Balance.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tessitura`/`trill` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Adagio" appears as a yellow level-up card in the three-card choice, reading "+6 max HP, +0.5 HP/s regen".
- [ ] Picking it raises max HP by 6 (the HP bar's maximum grows) and adds 0.5 HP/s regeneration per level, ticking the same way Balance's regen ticks.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append one new entry to the end of the `UPGRADES` array (after the `tessitura` entry, before the `];`)
- edit `tests/core/upgrades.test.ts` — add one test at the end of the `rollUpgradeChoices` describe block (after the `tessitura` test)

### Interfaces
None — data only. No new types, stats, or functions.

### Steps
1. In `src/content/upgrades/index.ts`, after the `tessitura` entry, add exactly:
```ts
  {
    id: 'adagio',
    name: 'Adagio',
    description: '+6 max HP, +0.5 HP/s regen',
    maxLevel: 3,
    weight: 5,
    mods: [
      { stat: 'maxHp', op: 'add', value: 6 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ],
    color: PALETTE.yellow,
  },
```
2. In `tests/core/upgrades.test.ts`, after the `tessitura` test, add exactly:
```ts
  it('adagio offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('adagio')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'maxHp', op: 'add', value: 6 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('adagio')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT add any field to `PlayerStats`/`BASE_STATS` — `maxHp` and `regenPerSec` already exist; regen ticks identically to Balance via `GameScene.ts:134`.
- Regen value is `0.5` (not `1`, not `1.0`); mod order is `maxHp` first then `regenPerSec` — the test's `toEqual` and the card copy depend on both.
- No `requires`/`requiresWeapon`/`grantsWeapon` fields — Adagio is offered from the first level-up.
- T0051 (Glissando) appends to the same array and test file; wait for it, then append Adagio after whatever T0051 added.
- `PALETTE.yellow` is already imported in the file; card renders yellow automatically from `def.color`.

### Tests
- New test `adagio offers 3 levels, then stops` in `tests/core/upgrades.test.ts` (snippet above); `tests/content.test.ts` validates the entry automatically.
