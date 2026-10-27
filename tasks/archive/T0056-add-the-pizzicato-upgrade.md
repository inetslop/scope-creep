---
id: T0056
title: Add the Pizzicato upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T01:47:24Z
claimed_at: 2026-10-27T01:55:43Z
finished_at: 2026-10-27T02:03:15Z
---

## Goal
A rare fast-pierce level-up card for players who want their shots to fly faster and punch through more enemies, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Glissando entry).
- `id: 'pizzicato'`, display name "Pizzicato", description `'+1 pierce, +10% projectile speed'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.ink` (same ink color as the `draft` entry).
- Two mods, copied from existing entries:
  - the pierce mod from the `ostinato` entry (same stat and op) — +1 pierce per level,
  - the projectile-speed mod from the `draft` entry (same stat and op) with value 1.10 (+10% projectile speed per level).
- At max level: +2 pierce and ×1.21 projectile speed; stacks with other cards that use the same stats (Vector, Ostinato, Draft, Fugue, Presto, Staccato, …).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `glissando`/`tessitura` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Pizzicato" appears as an ink-colored level-up card in the three-card choice, reading "+1 pierce, +10% projectile speed".
- [ ] Picking it adds +1 pierce to all weapon projectiles and +10% projectile speed per level; at 2 levels, +2 pierce and ×1.21 projectile speed.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` to the end of `UPGRADES` (after the current last entry, `adagio`)
- edit `tests/core/upgrades.test.ts` - append one `it(...)` test inside the existing `describe('rollUpgradeChoices')` block

### Interfaces
- none — pure content data. Reuses existing `UpgradeDef` (`src/content/types.ts`) and `StatMod` (`src/core/stats.ts`); stats `extraPierce` and `projectileSpeedMul` both exist in `PlayerStats`, and `PALETTE.ink` exists in `src/content/palette.ts`.

### Steps
1. In `src/content/upgrades/index.ts`, append after the last entry (`adagio`), before the `];`:
```ts
  {
    id: 'pizzicato',
    name: 'Pizzicato',
    description: '+1 pierce, +10% projectile speed',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.ink,
  },
```
(Mod order matters: pierce mod from `ostinato` first, projectile-speed mod from `draft` second, with value `1.10`.)
2. In `tests/core/upgrades.test.ts`, append after the `adagio` test (end of the describe block, before the closing `});`):
```ts
  it('pizzicato offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pizzicato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pizzicato')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check` (typecheck + lint + unit tests).

### Pitfalls
- `toEqual` on `mods` is order-sensitive — pierce mod first, speed mod second, exactly as in step 1.
- Don't assume `adagio` is the last entry: open the file and append after whichever entry is currently last (open task T0055 also appends to this array; re-check before editing).
- Use `1.10` (two decimals, matching `ostinato`/`staccato`/`presto` entries) and `op: 'mul'` for the speed mod — content.test.ts requires mul values > 0.
- No new files, no systems, no scene changes: `LevelUpScene` renders `name`/`description`/`color` from the def automatically; stacking and limits (`extraPierce` ≤ 20, `projectileSpeedMul` ≤ 4) are handled by `computeStats()`.

### Tests
- New unit test in `tests/core/upgrades.test.ts` (step 2); `tests/content.test.ts` auto-validates the new entry (unique id, stat names, mul > 0, non-empty mods).

## Result (attempt 1, yoga)

Added the Pizzicato upgrade — a rare (weight 3), ink-colored, 2-level card in `src/content/upgrades/index.ts` that grants +1 pierce (`extraPierce`) and +10% projectile speed (`projectileSpeedMul` × 1.10) per level, reaching +2 pierce and ×1.21 projectile speed at max and stacking with Vector/Ostinato/Draft/Fugue/Presto/Staccato via the existing `computeStats()` limits. Level-up rendering and the three-card choice need no code changes — `LevelUpScene` reads name/description/color from the def automatically. Added the matching unit test in `tests/core/upgrades.test.ts` asserting the exact two mods and that it is offered twice then stops; `npm run check` and `npm run smoke` (desktop + phone) both pass.

- Self-review: APPROVE
- Time: 7.5 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
