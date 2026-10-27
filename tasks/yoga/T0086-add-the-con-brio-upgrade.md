---
id: T0086
title: Add the Con Brio upgrade
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T07:13:18Z
---

## Goal
A new level-up card: **Con Brio** pairs +10% damage with +8% move speed — the fast-attack build that keeps both halves of the Dynamics trade-off instead of paying for one: hit harder while running harder.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Andante (T0079) and Gravure (T0080) entries). Open the file first and append after whichever entry is currently last — T0084 (Riff) is in progress on this same machine and will have appended an entry, so never assume which entry is last.
- `id: 'con-brio'` (kebab-case, passes the existing content validation), display name "Con Brio", description `'+10% damage, +8% move speed'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.red` (the same red as the aggressive cards `accent`, `allegro` and `impasto`).
- Two mods, copied from existing entries, damage first and move speed second:
  - a damage mod on the same `damageMul` stat and `mul` op that the `emphasis` entry uses, but with value ×1.10 — +10% damage per level,
  - a move-speed mod on the same `moveSpeed` stat and `mul` op that the `andante` entry uses, with value ×1.08 — +8% move speed per level.
- At max level: ≈×1.33 damage and ≈×1.26 move speed; stacks with the other cards that use those stats (Weight/Emphasis/Pressure/Fugue for damage, Momentum/Tempo/Allegro/Presto/Sweep/Legato for move speed).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, appended after the last test in the file, following the `andante` test pattern: assert the exact two mods (damage first, move speed second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Con Brio" appears as a red level-up card in the three-card choice, reading "+10% damage, +8% move speed".
- [ ] Picking it adds +10% damage and +8% move speed per level; at 3 levels ≈×1.33 damage and ≈×1.26 move speed (the player visibly runs faster and hits harder), stacking with Emphasis and Tempo builds.
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append the `con-brio` `UpgradeDef` at the end of the `UPGRADES` array
- edit `tests/core/upgrades.test.ts` — append the `con-brio` test after the last `it(...)` in the file
### Interfaces
None — no new types or signatures. `UpgradeDef` is unchanged; both stats already exist in `PlayerStats`, cards render from the registry automatically.
### Steps
1. Open `src/content/upgrades/index.ts`; after whichever entry is currently last in the array (open the file to see — do not assume), append:
```ts
  {
    id: 'con-brio',
    name: 'Con Brio',
    description: '+10% damage, +8% move speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'damageMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
    ],
    color: PALETTE.red,
  },
```
2. In `tests/core/upgrades.test.ts`, after the last `it(...)` in the file, append (the `andante` pattern):
```ts
  it('con brio offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('con-brio')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'damageMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('con-brio')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
### Pitfalls
- `mods` order is damage first, move speed second — `toEqual` is exact, order matters.
- Copy only the stat/op from `emphasis`; the damage value is `1.10`, not its `1.15`. The move-speed mod is identical to `andante`'s second mod.
- `id` must stay `con-brio` (kebab-case, unique — content test enforces it); `name`/`description` exactly as above; `maxLevel: 3`, `weight: 4`, `color: PALETTE.red`.
- Do NOT touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene — nothing new to register.
### Tests
- `tests/core/upgrades.test.ts`: the new test above; `tests/content.test.ts` already validates the entry automatically (id, stats, mul > 0).
