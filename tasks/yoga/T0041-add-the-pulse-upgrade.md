---
id: T0041
title: Add the Pulse upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
---

## Goal
A crit-shred build card: "Pulse" stacks fire rate and crit chance together, giving the crit build (Contrast, Accent) the tempo it currently lacks.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `fugue` entry is the closest example: two mods).
- Values: `id: 'pulse'`, `name: 'Pulse'`, `description: '+10% fire rate, +5% crit chance'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.red` (the crit theme, matching Contrast and Accent).
- `mods`: two mods — copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value `1.10`, and copy the crit mod from the `contrast` entry (same stat, same op) with value `0.05`.
- At 3 levels: ×1.33 fire rate (1.10³) and +15% crit chance.
- Add one small unit test to `tests/core/upgrades.test.ts` in the same style as the existing `presto` test: assert the exact two mods, apply the upgrade 3 times via `RunState.applyUpgrade`, and assert it is offered 3 times then stops.
- Do not change any other entry.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Pulse up to 3 times; each level multiplies fire rate by 1.10 and adds 0.05 crit chance
- [ ] It stacks with Rhythm (fire rate) and Contrast/Accent (crit chance) normally
- [ ] The new unit test in `tests/core/upgrades.test.ts` passes
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` entry to the end of the `UPGRADES` array (after the last entry, before the `];` on line 279). Do not touch any other entry or `UPGRADE_BY_ID` (it is derived automatically).
- edit `tests/core/upgrades.test.ts` - add one `it(...)` inside the existing `describe('rollUpgradeChoices', ...)` block, after the `presto` test (line 45).

### Interfaces
No new types or signatures. The entry must be exactly:

```ts
  {
    id: 'pulse',
    name: 'Pulse',
    description: '+10% fire rate, +5% crit chance',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ],
    color: PALETTE.red,
  },
```

### Steps
1. In `src/content/upgrades/index.ts`, insert the entry above as the last element of `UPGRADES` (copy the multi-line `mods` style from `fugue`).
2. In `tests/core/upgrades.test.ts`, add this test, copied from the `presto` test with `pulse` substituted (imports already exist — add none):

```ts
  it('pulse offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pulse')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pulse')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```

3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- If T0042 (Sweep) lands first, it also appends to `UPGRADES` — append after whatever the last entry is at that time, never re-order existing entries.
- `critChance` is clamped to 0.5 in `computeStats`; heavy stacking with Contrast/Accent is safe, nothing to add.
- Stacking is automatic: `applyUpgrade` pushes mods and refolds `computeStats`, so Rhythm/Pulse fire-rate muls and crit adds combine with no code change.
- Do not add `requires`/`grantsWeapon` — plain two-mod upgrade.

### Tests
- `tests/core/upgrades.test.ts`: the `pulse` test above. `tests/content.test.ts` validates the new entry automatically (id, stats, weight).
