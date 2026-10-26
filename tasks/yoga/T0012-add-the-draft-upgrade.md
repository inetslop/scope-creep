---
id: T0012
title: Add the Draft upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T17:58:28Z
claimed_at: 2026-10-26T19:20:34Z
finished_at: 2026-10-26T19:24:57Z
---

## Goal
A new upgrade that makes projectiles fly faster — a third axis for weapon builds alongside Rhythm (fire rate) and Weight (damage).

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'draft'`, `name: 'Draft'`, `description: '+25% projectile speed'`, `maxLevel: 3`, `weight: 5`, `color: PALETTE.ink`.
- `mods`: a single mod that multiplies projectile speed by 1.25 — copy the stat structure the `rhythm` entry uses for its fire-rate mod, but use the stat that controls how fast a weapon's projectiles travel.

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] Picking Draft makes all projectiles visibly faster
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one entry to the end of the `UPGRADES` array (after the `tempo` entry, before the closing `];` at line 125)

### Interfaces
No new types. `UpgradeDef` (`src/content/types.ts:110`) already covers all required fields; the mod uses the existing stat `projectileSpeedMul` from `PlayerStats` (`src/core/stats.ts:24`).

### Steps
1. In `src/content/upgrades/index.ts`, insert this entry after the `tempo` entry (line 124), keeping the 2-space indent style of the array:

```ts
  {
    id: 'draft',
    name: 'Draft',
    description: '+25% projectile speed',
    maxLevel: 3,
    weight: 5,
    mods: [{ stat: 'projectileSpeedMul', op: 'mul', value: 1.25 }],
    color: PALETTE.ink,
  },
```

2. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The stat is `projectileSpeedMul`, NOT `fireRateMul` (that is Rhythm's stat). It is actually read at `src/systems/WeaponSystem.ts:69` (`speed: def.speed * stats.projectileSpeedMul`), so picking Draft makes all projectiles visibly faster — no other code changes needed.
- Do not touch the `UPGRADE_BY_ID` line (line 127); it is derived from `UPGRADES` automatically.
- `draft` is a unique kebab-case id (verified: no clash in the array); `PALETTE.ink` already exists (used by `weight`).
- Max stack 3×1.25 = 1.95, under the `projectileSpeedMul` limit of 4 in `STAT_LIMITS` — no clamping surprises.
- No new system, no pooling, no listeners: nothing to clean up on shutdown.

### Tests
- none — `tests/content.test.ts` automatically validates the new entry (unique id, valid stat, mul > 0, does something).

## Result (attempt 1, yoga)

Added the "Draft" upgrade to `UPGRADES` in `src/content/upgrades/index.ts` — a size-S, max-3, weight-5, ink-colored upgrade whose single `projectileSpeedMul` ×1.25 mod makes all weapon projectiles 25% faster per level (stat read at `WeaponSystem.ts:69`), giving a third build axis alongside Rhythm and Weight. No other code changes were needed; `npm run check` (typecheck + lint + 44 tests) and `npm run smoke` (desktop + mobile browser play) both pass.

- Self-review: APPROVE
- Time: 4.4 min

```
game/src/content/upgrades/index.ts | 9 +++++++++
 1 file changed, 9 insertions(+)
```
