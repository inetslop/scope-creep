---
id: T0048
title: Add the Tessitura upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T00:03:46Z
claimed_at: 2026-10-27T00:05:28Z
---

## Goal
A pure survival ramp between Mass and Plate: Tessitura adds +10 max HP per level (5 levels), giving defensive players a long, cheap way to get thicker before the late game catches up.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pulse, Sweep and Trill entries).
- `id: 'tessitura'`, display name "Tessitura".
- `maxLevel: 5`, roll `weight: 4`, `color: PALETTE.yellow` (the defensive color, matching Plate).
- One mod, copied from the `mass` entry: the max-HP mod, but with value 10 (+10 max HP per level).
- At max level: +50 max HP. Stacks with Mass and Plate.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pulse`/`trill` test pattern: assert the exact mod, apply it 5 times, and assert it is offered 5 times then stops.

## Acceptance criteria
- [ ] "Tessitura" appears as a yellow level-up card named "Tessitura" in the three-card choice.
- [ ] Picking it raises the player's max HP by 10 (the HP bar's maximum grows); at 5 levels the player has +50 max HP over baseline.
- [ ] After 5 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` entry at the end of the `UPGRADES` array, after the `trill` entry (line 314), before the `];`
- edit `tests/core/upgrades.test.ts` - append one `it(...)` after the `trill` test (line 93), before the closing `});` of the describe block

### Interfaces
No new types or signatures. One data entry of the existing `UpgradeDef` type (`src/content/types.ts:137`).

### Steps
1. In `src/content/upgrades/index.ts`, insert exactly this after the `trill` entry's closing `},`:
```ts
  {
    id: 'tessitura',
    name: 'Tessitura',
    description: '+10 max HP',
    maxLevel: 5,
    weight: 4,
    mods: [{ stat: 'maxHp', op: 'add', value: 10 }],
    color: PALETTE.yellow,
  },
```
2. In `tests/core/upgrades.test.ts`, insert exactly this after the `trill` test's closing `});`:
```ts
  it('tessitura offers 5 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('tessitura')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'maxHp', op: 'add', value: 10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('tessitura')).toBe(5);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Copy only the max-HP mod from `mass` (line 52) — do NOT include its armor mod.
- Keep the single-mod inline style (`mods: [{ ... }]`) like `plate`, not `mass`'s multi-line array.
- Do not reorder or renumber existing entries; `UPGRADE_BY_ID` (line 317) is derived automatically.
- `applyUpgrade` (`src/core/run.ts:99`) already recomputes stats and heals by gained max HP, so the HP bar grows with no scene changes — touch nothing else.

### Tests
- New unit test in `tests/core/upgrades.test.ts` (exact code above). `tests/content.test.ts` and `core.test.ts` "never offers maxed upgrades" cover the entry automatically.
