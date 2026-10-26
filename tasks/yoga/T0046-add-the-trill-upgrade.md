---
id: T0046
title: Add the Trill upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0042]
attempts: 1
created: 2026-10-26T23:43:51Z
claimed_at: 2026-10-26T23:53:31Z
---

## Goal
A rare repeat-fire card for the volley build: Trill adds an extra projectile and a fire-rate bump, giving Repetition/Rhythm players a strong endgame pick.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pulse and Sweep entries).
- `id: 'trill'`, display name "Trill".
- `maxLevel: 2`, roll `weight: 3` (rare, matching the Ostinato entry), `color: PALETTE.red`.
- Two mods, copied from existing entries:
  - +1 projectile per volley — copy the exact projectile-count mod from the `repetition` entry.
  - ×1.08 fire rate per level — copy the fire-rate mod from the `rhythm` entry, but with a 1.08 multiplier.
- At max level: +2 projectiles per volley and ≈×1.166 fire rate. Stacks with Repetition, Rhythm, Tempo and every other fire-rate card.

## Acceptance criteria
- [ ] "Trill" appears as a red level-up card named "Trill" in the three-card choice.
- [ ] Picking it adds +1 projectile to every volley and +8% fire rate; picking it a second time adds another +1 projectile and +8% fire rate.
- [ ] After 2 levels it is never offered again (covered by the existing upgrade roll test).

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` (Trill) at the end of the `UPGRADES` array, after the `pulse` entry (before the `];` at line 291)
- edit `tests/core/upgrades.test.ts` - add one test after the `pulse offers 3 levels, then stops` test

### Interfaces
None new. Uses existing `UpgradeDef` (`src/content/types.ts:137`) and `StatMod` (`src/core/stats.ts:37`). No new stat: `extraProjectiles` and `fireRateMul` already exist in `PlayerStats`.

### Steps
1. In `src/content/upgrades/index.ts`, insert exactly this between the `pulse` entry and the closing `];`:
```ts
  {
    id: 'trill',
    name: 'Trill',
    description: '+1 projectile per volley, +8% fire rate',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    ],
    color: PALETTE.red,
  },
```
2. In `tests/core/upgrades.test.ts`, add after the `pulse` test (all imports it needs are already there):
```ts
  it('trill offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('trill')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('trill')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`. It must pass.

### Pitfalls
- Append only: do not reorder or reformat existing entries, and do not touch `UPGRADE_BY_ID` (it is derived from the array).
- No system, scene, art or audio changes: `WeaponSystem` already reads `stats.extraProjectiles` (`src/systems/WeaponSystem.ts:56`) and `stats.fireRateMul` (`:37`); `LevelUpScene` renders `def.name`/`def.color` generically; `tests/content.test.ts` validates the new entry automatically.
- `RunState.applyUpgrade` re-pushes `def.mods` per pick, so 2 levels = +2 projectiles and 1.08×1.08 ≈ ×1.166 fire rate — do not pre-multiply or add a second entry.
- T0042 (Sweep) also appends to this same array: implement Trill only after T0042 has landed, appending after whatever entry is last at that time.

### Tests
- `tests/core/upgrades.test.ts`: the `trill` test above (mirrors the `pulse`/`presto` pattern; covers "never offered after 2 levels").
- `tests/content.test.ts`: no changes needed; it validates the new entry (unique kebab-case id, known stats, weight > 0).
