---
id: T0062
title: Add the Impasto upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T02:46:28Z
claimed_at: 2026-10-27T03:03:14Z
finished_at: 2026-10-27T03:10:20Z
---

## Goal
A rare "heavy volley" level-up card — an extra projectile plus solid damage on one card — for players who want their volleys to hit like a rolling pin, reusing two existing stats.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Pizzicato and Pedal entries). Open the file first and append after whichever entry is currently last — open task T0055 (Counterpoint, on desktop-4070) also appends a card to this array, so never assume which entry is last.
- `id: 'impasto'`, display name "Impasto", description `'+1 projectile per volley, +15% damage'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.red` (same red as the `trill` entry — the other rare +1 projectile card).
- Two mods, copied from existing entries:
  - the +1 projectile-per-volley mod from the `repetition` entry (same stat and op) — +1 projectile per level,
  - the +15% damage mod from the `emphasis` entry (same stat and op) — +15% damage per level.
- At max level: +2 projectiles per volley and +30% damage; stacks with the other cards that use those stats (Repetition/Trill for projectiles, Weight/Emphasis/Fugue/Pressure/Dynamics for damage).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`pedal` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Impasto" appears as a red level-up card in the three-card choice, reading "+1 projectile per volley, +15% damage".
- [ ] Picking it adds +1 projectile per volley and +15% damage per level; at 2 levels, +2 projectiles per volley and +30% damage.
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` entry at the END of the `UPGRADES` array, after whichever entry is currently last (re-open the file at edit time; T0055 also appends here, so do not assume `pedal` is last)
- edit `tests/core/upgrades.test.ts` - add one test after the `pedal` test, copied from the `pizzicato` test block

### Interfaces
No new types or functions. The exact entry to append:
```ts
{
  id: 'impasto',
  name: 'Impasto',
  description: '+1 projectile per volley, +15% damage',
  maxLevel: 2,
  weight: 3,
  mods: [
    { stat: 'extraProjectiles', op: 'add', value: 1 },
    { stat: 'damageMul', op: 'mul', value: 1.15 },
  ],
  color: PALETTE.red,
},
```
The exact test (copy the pizzicato block, swap id and mods):
```ts
it('impasto offers 2 levels, then stops', () => {
  const run = new RunState(1);
  const def = UPGRADE_BY_ID.get('impasto')!;
  expect(def).toBeDefined();
  expect(def.mods).toEqual([
    { stat: 'extraProjectiles', op: 'add', value: 1 },
    { stat: 'damageMul', op: 'mul', value: 1.15 },
  ]);
  for (let i = 0; i < def.maxLevel; i++) {
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
    run.applyUpgrade(def);
  }
  expect(run.upgradeLevel('impasto')).toBe(2);
  expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
});
```

### Steps
1. Open `src/content/upgrades/index.ts`, append the entry after the array's current last entry, before the closing `];`.
2. In `tests/core/upgrades.test.ts`, append the test above after the `pedal` test (inside the existing `describe`).
3. Run `npm run check` and `npm run smoke`.

### Pitfalls
- `damageMul` must be `op: 'mul'` (copied from `emphasis`), NOT `add`; `extraProjectiles` must be `op: 'add'` (copied from `repetition`).
- `id: 'impasto'` must be unique kebab-case — tests/content.test.ts checks duplicates.
- `weight: 3` and `color: PALETTE.red` match the `trill` entry exactly, per the spec.
- Do not reorder or touch any other entry; if T0055's Counterpoint entry lands in this same spot, keep both entries and re-append after whichever is last.

### Tests
- `tests/core/upgrades.test.ts`: "impasto offers 2 levels, then stops" — exact two mods, applied 2×, not offered after 2 levels.

## Result (attempt 1, yoga)

Added the "Impasto" upgrade to `src/content/upgrades/index.ts` (appended at the end of `UPGRADES` after `pedal`): a red, weight-3, max-2-level card reading "+1 projectile per volley, +15% damage", with `extraProjectiles`/`add`/1 (from `repetition`) and `damageMul`/`mul`/1.15 (from `emphasis`) — so 2 levels give +2 projectiles per volley and stacked +15%/level damage, stacking with the other projectile/damage cards. Added the matching `tests/core/upgrades.test.ts` case asserting the exact two mods, 2 applications, and no offer after max. `npm run check` passes (210 tests) and `npm run smoke` passes on desktop and mobile.

- Self-review: APPROVE
- Time: 7.1 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
