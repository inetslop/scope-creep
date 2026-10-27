---
id: T0060
title: Add the Pedal upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T02:15:10Z
claimed_at: 2026-10-27T02:31:10Z
---

## Goal
A defensive "tortoise" level-up card — armor plus steady regeneration on one card — for players who want to stay unbroken, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pizzicato entry). Open the file first and append after whichever entry is currently last — open task T0055 (Counterpoint) also appends a card to this array, so never assume which entry is last.
- `id: 'pedal'`, display name "Pedal", description `'+1 armor, +0.5 HP/s regen'`.
- `maxLevel: 2`, roll `weight: 4`, `color: PALETTE.yellow` (same yellow as the `plate` and `adagio` entries).
- Two mods, copied from existing entries:
  - the armor mod from the `plate` entry (same stat and op) — +1 armor per level,
  - the regen mod from the `adagio` entry (same stat and op) — +0.5 HP/s regen per level.
- At max level: +2 armor and +1 HP/s regen; stacks with the other cards that use those stats (Mass, Plate, Balance, Adagio).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`adagio` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Pedal" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +0.5 HP/s regen".
- [ ] Picking it adds +1 armor and +0.5 HP/s regen per level; at 2 levels, +2 armor and +1 HP/s regen.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` entry at the end of the `UPGRADES` array, after whichever entry is currently last (open the file; do not assume it is `pizzicato` — T0055 may have appended first).
- edit `tests/core/upgrades.test.ts` - append one new `it(...)` block at the end of the `describe('rollUpgradeChoices', ...)` block, copying the `pizzicato` test shape.

### Interfaces
No types or functions change. The new entry (exact code):
```ts
{
  id: 'pedal',
  name: 'Pedal',
  description: '+1 armor, +0.5 HP/s regen',
  maxLevel: 2,
  weight: 4,
  mods: [
    { stat: 'armor', op: 'add', value: 1 },
    { stat: 'regenPerSec', op: 'add', value: 0.5 },
  ],
  color: PALETTE.yellow,
},
```
New test (exact, after the `pizzicato` test):
```ts
it('pedal offers 2 levels, then stops', () => {
  const run = new RunState(1);
  const def = UPGRADE_BY_ID.get('pedal')!;
  expect(def).toBeDefined();
  expect(def.mods).toEqual([
    { stat: 'armor', op: 'add', value: 1 },
    { stat: 'regenPerSec', op: 'add', value: 0.5 },
  ]);
  for (let i = 0; i < def.maxLevel; i++) {
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
    run.applyUpgrade(def);
  }
  expect(run.upgradeLevel('pedal')).toBe(2);
  expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
});
```

### Steps
1. In `src/content/upgrades/index.ts`, insert the entry above as the last element of `UPGRADES` (before the closing `];`). `PALETTE` is already imported in that file.
2. In `tests/core/upgrades.test.ts`, insert the `it(...)` block above just before the block's closing `});`. All imports it uses already exist.
3. Run `npm run check` (typecheck + lint + all unit tests including `tests/content.test.ts`, which auto-validates the new entry).

### Pitfalls
- Mod order matters for the `toEqual` assertion: `armor` first, then `regenPerSec` (mirrors `adagio`'s order).
- `maxLevel: 2` and `weight: 4` per spec — `plate`'s `maxLevel`/`weight` differ; do not copy them.
- Do not add `requires`/`requiresWeapon`/`grantsWeapon` — plain stat mods only.
- No scene/HUD code to touch: cards render from `UpgradeDef` fields generically, so no mobile layout work.

### Tests
- `tests/core/upgrades.test.ts`: the `pedal offers 2 levels, then stops` test above (asserts exact two mods, 2 offers then stops). Existing `tests/content.test.ts` covers the rest.
