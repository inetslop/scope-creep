---
id: T0002
title: Add the Tempo upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
claimed_at: 2026-10-26T19:04:38Z
---

## Goal
A new hybrid upgrade that makes the player a bit faster at everything.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the `UPGRADES` array, after `composition`, in the same style as the others.
- Values: `id: 'tempo'`, `name: 'Tempo'`, `description: '+8% move speed, +8% fire rate'`, `maxLevel: 3`, `weight: 6`, `color: PALETTE.orange`.
- `mods`: `{ stat: 'moveSpeed', op: 'mul', value: 1.08 }` and `{ stat: 'fireRateMul', op: 'mul', value: 1.08 }`.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, asus)

### Files
- edit `src/content/upgrades/index.ts` — append one entry to the `UPGRADES` array, after the last entry (currently `composition`, ending line 112), before the closing `];`. No other file changes; `UPGRADE_BY_ID` (line 115) is derived automatically.

### Interfaces
None new. The entry must satisfy the existing `UpgradeDef` (src/content/types.ts:110).

### Steps
1. In `src/content/upgrades/index.ts`, insert exactly this after the `composition` entry's closing `},`:

```ts
  {
    id: 'tempo',
    name: 'Tempo',
    description: '+8% move speed, +8% fire rate',
    maxLevel: 3,
    weight: 6,
    mods: [
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    ],
    color: PALETTE.orange,
  },
```

2. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Stat names are case-sensitive and checked against `BASE_STATS`: exactly `moveSpeed`, `fireRateMul` — not `move_speed`/`fire_rate`.
- `id` must be unique kebab-case (`tempo`); a duplicate fails `tests/content.test.ts`.
- Do not add `grantsWeapon`, `requires`, or `requiresWeapon` fields; do not touch `PALETTE` or `core/stats.ts` — both stats already exist.
- If another task (e.g. T0012/T0013) has already appended entries after `composition` when you start, append after the last entry instead — the position inside the array does not matter.

### Tests
None — `tests/content.test.ts` validates the new entry automatically (id pattern/uniqueness, name/description, `maxLevel >= 1`, `weight > 0`, mod stats known, `mul` values > 0).
