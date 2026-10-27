---
id: T0079
title: Add the Andante upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: [T0078]
attempts: 0
created: 2026-10-27T05:31:40Z
---

## Goal
A 44th level-up card — Andante — that pairs regen with move speed: the walking-pace sustain-mobility card for builds that want to heal between hits and still keep moving. It is the last untapped pair on the regen axis (every other regen card is taken: Balance, Adagio, Pedal, Sotto Voce).

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Marcato (T0078) and Stretto (T0077) entries). Open the file first and append after whichever entry is currently last — T0076 (Vellum), T0077 (Stretto) and T0078 (Marcato) are queued on this same machine ahead of this task and will each have appended an entry, so never assume which entry is last.
- `id: 'andante'` (one word, passes the existing kebab-case content validation), display name "Andante", description `'+0.5 HP/s regen, +8% move speed'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the sustain cards `adagio`, `pedal` and `sotto-voce`).
- Two mods, copied from existing entries, regen first and move speed second:
  - the +0.5 HP/s regen mod from the `adagio` entry (same stat `regenPerSec`, same op `add`, value 0.5 — the identical mod `pedal` uses) — +0.5 HP/s regen per level,
  - a move-speed mod on the same `moveSpeed` stat and `mul` op that `allegro` and `presto` use, but with value ×1.08 — +8% move speed per level.
- At max level: +1.5 HP/s regen and ≈×1.26 move speed; stacks with the other cards that use those stats (Balance/Adagio/Pedal/Sotto Voce for regen, Momentum/Allegro/Staccato/Presto/Sweep/Legato for move speed).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tenuto`/`stretto`/`marcato` test pattern: assert the exact two mods (regen first, move speed second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Andante" appears as a yellow level-up card in the three-card choice, reading "+0.5 HP/s regen, +8% move speed".
- [ ] Picking it adds +0.5 HP/s regen and +8% move speed per level; at 3 levels, +1.5 HP/s regen and ≈×1.26 move speed (the player visibly heals between hits and keeps a walking pace).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append the Andante `UpgradeDef` entry to `UPGRADES`
- edit `tests/core/upgrades.test.ts` - append the andante level test

### Interfaces
No new types or functions. Entry uses the existing `UpgradeDef` (`src/content/types.ts`); both stats (`regenPerSec`, `moveSpeed`) already exist in `PlayerStats`.

### Steps
1. Open `src/content/upgrades/index.ts`, find the entry currently LAST in the `UPGRADES` array (in this checkout it is `stretto`; T0078 Marcato may have landed ahead — never assume, look) and append after it, before the closing `];`:
```ts
  {
    id: 'andante',
    name: 'Andante',
    description: '+0.5 HP/s regen, +8% move speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
    ],
    color: PALETTE.yellow,
  },
```
2. In `tests/core/upgrades.test.ts`, after the last test in the `describe('rollUpgradeChoices')` block (copy the `stretto` test and swap the id/mods):
```ts
  it('andante offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('andante')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('andante')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Mod order is regen first, move speed second — `toEqual` is order-sensitive, so keep that order in BOTH the data and the test.
- Move-speed value is exactly `1.08` (the "+8%" value `tempo` uses); content validation only requires `mul` > 0. 3 levels ≈ ×1.26 (1.08³).
- Description string must be exactly `'+0.5 HP/s regen, +8% move speed'` — the card renders it verbatim from the registry.
- Do not touch `src/core/stats.ts`, `src/content/types.ts`, or any scene; `LevelUpScene` renders cards from `UPGRADE_BY_ID` using `def.color`, so yellow comes for free. `regenPerSec` caps at 50, `moveSpeed` at 600 — no clamp risk.
- Append-only: don't reorder `UPGRADES` (T0078 appends to the same array and test file).

### Tests
- `tests/core/upgrades.test.ts`: the andante test above (mods asserted exactly, offered 3× then stops). `tests/content.test.ts` auto-validates the new entry.
