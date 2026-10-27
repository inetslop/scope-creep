---
id: T0080
title: Add the Gravure upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: [T0079]
attempts: 0
created: 2026-10-27T05:46:39Z
---

## Goal
A 45th level-up card — Gravure — that pairs pierce with damage: the rare card for pierce builds, so a volley that already carves through a crowd hits harder on the way through. It completes the core of the pierce axis (Vector's pure pierce, Ostinato's pierce + fire rate, Pizzicato's pierce + projectile speed) with the one stat a piercing volley wants most: damage.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Stretto (T0077), Marcato (T0078) and Andante (T0079) entries). Open the file first and append after whichever entry is currently last — T0078 (Marcato) and T0079 (Andante) are queued on this same machine ahead of this task and will each have appended an entry, so never assume which entry is last.
- `id: 'gravure'` (one word, passes the existing kebab-case content validation), display name "Gravure", description `'+1 pierce, +15% damage'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.ink` — a rare sibling of the two-level pierce cards `ostinato` and `pizzicato` (same weight and ink color as `pizzicato`).
- Two mods, copied from existing entries, pierce first and damage second:
  - the +1 pierce mod from the `pizzicato` entry (same stat `extraPierce`, same op `add`, value 1 — the identical mod `vector` and `ostinato` use) — +1 pierce per level,
  - a damage mod on the same `damageMul` stat and `mul` op that `emphasis` uses, with value ×1.15 — +15% damage per level.
- At max level: +2 pierce and ≈×1.32 damage; stacks with the other pierce cards (Vector, Ostinato, Pizzicato) and the damage cards (Weight, Emphasis, Fugue, Pressure, Tenuto, Impasto).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the two-level-card pattern already in the file (e.g. the `pizzicato` test): assert the exact two mods in order (pierce first, damage second), apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Gravure" appears as an ink level-up card in the three-card choice, reading "+1 pierce, +15% damage".
- [ ] Picking it makes volleys pierce +1 enemy and deal +15% damage per level; at 2 levels, +2 pierce and ≈×1.32 damage (volleys visibly carve through an extra enemy and hit harder).
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` at the END of the `UPGRADES` array (open the file first; add after whichever entry is currently last)
- edit `tests/core/upgrades.test.ts` - append one test inside the `describe('rollUpgradeChoices', ...)` block

### Interfaces
No new types or signatures. `extraPierce` and `damageMul` already exist in `PlayerStats`; the level-up scene renders cards from the registry automatically. Do not touch `src/core/stats.ts`, `src/content/types.ts`, or any scene.

### Steps
1. In `src/content/upgrades/index.ts`, append after the last entry of `UPGRADES`:
```ts
  {
    id: 'gravure',
    name: 'Gravure',
    description: '+1 pierce, +15% damage',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.15 },
    ],
    color: PALETTE.ink,
  },
```
2. In `tests/core/upgrades.test.ts`, copy the `pizzicato` test (line 142) and adapt: `it('gravure offers 2 levels, then stops', ...)`, `UPGRADE_BY_ID.get('gravure')!`, mods asserted in this exact order `[ { stat: 'extraPierce', op: 'add', value: 1 }, { stat: 'damageMul', op: 'mul', value: 1.15 } ]`, loop `for (let i = 0; i < def.maxLevel; i++)` with the same `isUpgradeAvailable`/`applyUpgrade` lines, then `expect(run.upgradeLevel('gravure')).toBe(2)` and `isUpgradeAvailable(...) toBe(false)`.
3. Run `npm run check` then `npm run smoke`.

### Pitfalls
- `damageMul` is a multiplier: value is `1.15` (like `emphasis`), NOT `0.15`; op is `mul`, NOT `add`.
- Mod order is pierce first, damage second — the test asserts it, so a swapped order fails.
- `weight: 3` (rare, like `pizzicato`), not 4; `maxLevel: 2`; `color: PALETTE.ink`.
- `id: 'gravure'` — one word, no hyphen; it must be unique and kebab-case (content test enforces both).
- Do not reorder or modify existing entries; append only.

### Tests
- New unit test in `tests/core/upgrades.test.ts` as specified in step 2; existing content validation + `rollUpgradeChoices` tests cover the rest.
