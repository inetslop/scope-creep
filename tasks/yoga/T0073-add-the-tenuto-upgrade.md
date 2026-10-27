---
id: T0073
title: Add the Tenuto upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T04:08:50Z
---

## Goal
An "armored hammer" level-up card — armor plus damage on one card — the first card to pair the defensive axis with the offensive axis, for players who want to wade into the swarm and hit back harder.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067) and Arpeggio (T0069) entries). Open the file first and append after whichever entry is currently last — T0072 (Legato, also on yoga) runs before this one, and the open tasks T0069 (Arpeggio, yoga) and T0055 (Counterpoint, desktop-4070) may also have appended to this array, so never assume which entry is last.
- `id: 'tenuto'`, display name "Tenuto", description `'+1 armor, +10% damage'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the defensive cards `plate` and `pedal`).
- Two mods, copied from existing entries:
  - the +1 armor mod from the `plate` entry (same stat and op, value 1) — +1 armor per level,
  - the +10% damage mod from the `pressure` entry (same stat and op, value 1.10) — +10% damage per level.
- At max level: +3 armor and ≈×1.33 damage; stacks with the other cards that use those stats (Mass/Plate/Pedal for armor, Weight/Emphasis/Pressure/Accent for damage).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Tenuto" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +10% damage".
- [ ] Picking it adds +1 armor and +10% damage per level; at 3 levels, +3 armor and ≈×1.33 damage (the player visibly shrugs off more hits and their damage numbers go up).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append the new `tenuto` `UpgradeDef` at the end of `UPGRADES`
- edit `tests/core/upgrades.test.ts` - add the "tenuto offers 3 levels, then stops" test

### Interfaces
None. No new types: `tenuto` uses only existing `UpgradeDef` fields and existing stats `armor` and `damageMul` (both already in `PlayerStats`/`BASE_STATS`).

### Steps
1. Open `src/content/upgrades/index.ts`, read it fresh, and append after whichever entry is LAST in `UPGRADES` (do not assume it is `arpeggio` — T0069/T0072/T0055 may have appended):
```ts
  {
    id: 'tenuto',
    name: 'Tenuto',
    description: '+1 armor, +10% damage',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.yellow,
  },
```
   (armor mod copied from `plate`, damage mod copied from `pressure`, exactly as shown above.)
2. In `tests/core/upgrades.test.ts`, add inside the `rollUpgradeChoices` describe block (e.g. after the `impasto` test), following the existing pattern:
```ts
  it('tenuto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('tenuto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('tenuto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `toEqual` on `mods` is order-sensitive: armor mod first, damageMul second (matches description order).
- Do NOT touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene — `GameScene` rolls from `UPGRADES` and `LevelUpScene` renders from `UPGRADE_BY_ID`; the yellow card appears automatically from the registry.
- T0069/T0072/T0055 append to the same two files; re-read them before editing and if git conflicts, keep the other entries AND add tenuto after the new last one.
- `tests/content.test.ts` validates the new entry automatically (unique kebab-case id, weight > 0, known stats, mul value > 0) — do not edit it.

### Tests
- `tests/core/upgrades.test.ts`: the tenuto test above (exact 2 mods, offered 3× then stops).
