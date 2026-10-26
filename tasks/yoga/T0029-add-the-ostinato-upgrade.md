---
id: T0029
title: Add the Ostinato upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T20:55:07Z
claimed_at: 2026-10-26T21:09:05Z
finished_at: 2026-10-26T21:15:19Z
---

## Goal
A rare build card combining pierce and fire rate — the backbone of a pierce build, alongside Vector and Rhythm.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others (the `allegro` entry is the closest example: two mods).
- Values: `id: 'ostinato'`, `name: 'Ostinato'`, `description: '+1 pierce, +10% fire rate'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink`.
- `mods`: two mods — copy the pierce mod from the `vector` entry (same stat, same op) with value 1, and copy the fire-rate mod from the `rhythm` entry (same stat, same op) with value 1.10.
- At 2 levels: +2 pierce and ×1.21 fire rate.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Ostinato up to 2 times; each level adds +1 pierce and multiplies fire rate by 1.10 (2 levels = +2 pierce, ≈ ×1.21 fire rate)
- [ ] It stacks with Vector and Rhythm normally
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` — append one `UpgradeDef` entry to the end of the `UPGRADES` array, after the `allegro` entry (the last entry, before the `];` at line 195). No other file changes.

### Interfaces
None. Pure data entry using the existing `UpgradeDef` (`src/content/types.ts:126`); both stats already exist in `PlayerStats` (`extraPierce`, `fireRateMul` in `src/core/stats.ts`) and are already read by `src/systems/WeaponSystem.ts:37,71`.

### Steps
1. In `src/content/upgrades/index.ts`, insert this entry between the closing `},` of `allegro` and the `];`:
```ts
  {
    id: 'ostinato',
    name: 'Ostinato',
    description: '+1 pierce, +10% fire rate',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.ink,
  },
```
2. Run `npm run check` (typecheck + lint + tests; `tests/content.test.ts` validates the new entry automatically).
3. Run `npm run smoke`.

### Pitfalls
- Keep the array syntax intact: entry ends with `},` and the array still closes with `];`. Do not touch any other entry.
- `value: 1.10` is intentional and lint-safe (verified against `no-loss-of-precision`); do not "fix" it.
- Do not add `requires`, `requiresWeapon`, or `grantsWeapon` — not part of this card.
- No new system, so no `hook.addInvariant()`, no pooling, no scene listeners, no art/layout work.

### Tests
- none (content test auto-validates; behavior is covered by the existing roll/stats code paths).

## Result (attempt 1, yoga)

Added the Ostinato upgrade to `src/content/upgrades/index.ts` — a rare (weight 3), max-2-level card that adds +1 pierce and ×1.10 fire rate per level (2 levels = +2 pierce, ≈×1.21 fire rate), using the same `extraPierce`/`fireRateMul` stats and ops as the existing Vector and Rhythm entries so it stacks with them normally. The content test auto-validates the new entry, `npm run check` passes (typecheck + lint + 75 tests), and `npm run smoke` passes on both desktop and mobile.

- Self-review: APPROVE
- Time: 6.2 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 1 file changed, 12 insertions(+)
```
