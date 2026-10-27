---
id: T0084
title: Add the Riff upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T06:43:50Z
---

## Goal
One more level-up card: Riff, the last untapped pair on the projectile axis — a rare card that adds a projectile to every volley and makes each one pierce, so spread builds punch through whole rows of shapes.

## Details
- New `riff` entry appended at the end of `UPGRADES` in `src/content/upgrades/index.ts` (after the `incision` entry, the current last one). Copy the entry shape of the `arpeggio` and `impasto` entries: both mod fields it uses, `extraProjectiles` (add) and `extraPierce` (add), already exist on those cards.
- Exact values: `id: 'riff'`, `name: 'Riff'`, `description: '+1 projectile per volley, +1 pierce'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.green`; mods: `extraProjectiles` add 1 and `extraPierce` add 1 per level (max = +2 projectiles per volley and +2 pierce).
- Green is deliberate: the rest of the +1-projectile family (Trill red, Vivace orange, Impasto red, Arpeggio red) is warm, and Riff is the family's last card.
- Include a small unit test in the same shape as the tests shipped with T0081/T0076: apply `riff` twice to a fresh run and assert +2 extra projectiles per volley and +2 pierce over base; a fresh run without Riff has neither.

## Acceptance criteria
- [ ] A level-up roll can deal a green card "Riff — +1 projectile per volley, +1 pierce".
- [ ] Picking Riff twice gives +2 projectiles per volley and +2 pierce, stacking with Trill/Vivace/Impasto/Arpeggio on one axis and Vector/Ostinato/Pizzicato/Gravure/Incision on the other.
- [ ] A maxed Riff (level 2) is never offered again.
- [ ] The new unit test passes in the automated gate.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append one entry to `UPGRADES` after the `incision` entry (the current last entry, ending line 515), before the closing `];`. No new files.
- edit `tests/core/upgrades.test.ts` — append one `it` block inside the existing `describe('rollUpgradeChoices')`, after the `incision` test (after line 364), before the describe's closing `});`.

### Interfaces
No types change; `riff` is a plain `UpgradeDef` (both mod stats already exist in `PlayerStats` and are read by `src/systems/WeaponSystem.ts:57,72`).

### Steps
1. In `src/content/upgrades/index.ts`, add exactly (field order must match `trill`/`incision`):
```ts
  {
    id: 'riff',
    name: 'Riff',
    description: '+1 projectile per volley, +1 pierce',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'extraPierce', op: 'add', value: 1 },
    ],
    color: PALETTE.green,
  },
```
2. In `tests/core/upgrades.test.ts`, add exactly (same shape as the `incision`/`gravure` tests; imports `RunState`, `UPGRADE_BY_ID`, `isUpgradeAvailable` are already present):
```ts
  it('riff offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('riff')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'extraPierce', op: 'add', value: 1 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('riff')).toBe(2);
    expect(run.stats.extraProjectiles).toBe(2);
    expect(run.stats.extraPierce).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
    const plain = new RunState(1);
    expect(plain.stats.extraProjectiles).toBe(0);
    expect(plain.stats.extraPierce).toBe(0);
  });
```
3. Run `npm run check`.

### Pitfalls
- Mod order in the entry is `extraProjectiles` then `extraPierce` — the test's `toEqual` is order-sensitive; keep both in the same order.
- No `requires`/`requiresWeapon`/`grantsWeapon` on `riff`; it is a pure mod card. No scene, system, or art change: `LevelUpScene` renders `def.color`/`name`/`description` generically, and `WeaponSystem` already reads both stats (stacking with Trill/Vivace/Impasto/Arpeggio and Vector/Ostinato/Pizzicato/Gravure/Incision is automatic — `computeStats` sums all add-mods; maxed-out exclusion comes from the generic `maxLevel` check in `isUpgradeAvailable`).
- `PALETTE.green` already exists (`src/content/palette.ts`); do not add a palette entry. `tests/content.test.ts` validates the new entry automatically (kebab-case id, weight > 0, stats in `BASE_STATS`).
