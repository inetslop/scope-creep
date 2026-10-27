---
id: T0087
title: Add the Divider enemy
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T07:13:18Z
claimed_at: 2026-10-27T07:32:28Z
finished_at: 2026-10-27T07:42:05Z
---

## Goal
A new late-run harasser: the **Divider**, a small ink hexagon that never closes the distance — it strafes at close range and picks you off with fast, light shots. The kiting-shooter niche now has a fast, fragile version to pair with the Sentry (medium) and the Counterweight (heavy).

## Details
- New data file `src/content/enemies/divider.ts`, copied line by line from `src/content/enemies/sentry.ts` (the prototype kiting shooter) with only the values below changed — same `shoot` behavior, same shot visual.
- `id: 'divider'`, name "Divider".
- All-caps marginalia `note` field (same field the Sentry has): "IT HOLDS ITS DISTANCE".
- hp 16, speed 170, contactDamage 8, xp 2, threat 2, spawnWeight 4, unlockAtSec 200, knockbackResist 0.2.
- Shoot parameters (the Sentry holds a 240–300 band and fires every 2.4 s at speed 150 / 8 damage): hold a 140–190 unit band, fire every 1.4 s, bullet speed 260, bullet damage 6 — closer in, much faster-firing, but each shot does less.
- `look`: shape `hexagon` (the same shape `src/content/enemies/hex.ts` uses), radius 13, body `PALETTE.ink`, accent `PALETTE.paperLight` (the small paper-light dot Mote and Counterweight show), spin 0.8.
- Register it in the enemy roster the same way the Sentry and Counterweight are registered (the content index; imports stay alphabetical, the def appends at the end of the array) — `tests/content.test.ts` picks the new entry up automatically.
- No scene, system, or stat changes: the `shoot` behavior, the hexagon shape and all stats already exist.

## Acceptance criteria
- [ ] After 200 s of a run a small ink hexagon can spawn; on its first appearance the marginalia "IT HOLDS ITS DISTANCE" fades in beside it.
- [ ] It keeps ~140–190 units from the player and strafes sideways, firing a fast ink point (speed 260, 6 damage) every 1.4 s — noticeably closer in and faster-firing than the Sentry, with visibly lighter shots.
- [ ] It moves at speed 170, has 16 hp, and deals 8 contact damage.
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.

## Design (architect, yoga)

### Files
- create `src/content/enemies/divider.ts` - the Divider enemy def, data only
- edit `src/content/enemies/index.ts` - register the def (one import + array append)

### Interfaces
No new types; `EnemyDef.shoot` already has `periodSec`, `speed`, `damage`, `bandNear`, `bandFar`. No code changes anywhere else — `shoot` behavior, hexagon texture, and first-sighting marginalia (`SpawnSystem` → `Marginalia.note`) are all generic on `def`.

Exact content of `src/content/enemies/divider.ts` (copy sentry.ts, replace values as shown — note: Sentry has NO `shoot` field; Divider must add one, like counterweight.ts:18):

```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Late-run harasser: a small ink hexagon that holds close range and fires fast, light ink points. */
export const divider: EnemyDef = {
  id: 'divider',
  name: 'Divider',
  note: 'IT HOLDS ITS DISTANCE',
  hp: 16,
  speed: 170,
  contactDamage: 8,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 200,
  behavior: 'shoot',
  knockbackResist: 0.2,
  shoot: { periodSec: 1.4, speed: 260, damage: 6, bandNear: 140, bandFar: 190 },
  look: {
    shape: 'hexagon',
    radius: 13,
    body: PALETTE.ink,
    accent: PALETTE.paperLight,
    spin: 0.8,
  },
};
```

### Steps
1. Create `src/content/enemies/divider.ts` exactly as above (update the file comment; do not leave the Sentry's).
2. In `src/content/enemies/index.ts`: add `import { divider } from './divider';` between the existing `dart` and `eraser` imports (keeps alphabetical), and append `divider` at the END of the `ENEMIES` array: `... eraser, frameWedge, counterweight, divider]`.

### Pitfalls
- The #1 trap: copying sentry.ts verbatim silently keeps its defaults (2.4 s / 150 / 8 / 240–300 band) because Sentry has no `shoot` field — the divider would play like a slow Sentry and fail the shoot criteria. The `shoot: {...}` line is mandatory.
- `note` must be all caps or `tests/content.test.ts` fails; id must be kebab-case.
- Don't touch `content/types.ts` or any scene/system — nothing new exists to register.
- Radius 13 is fine (test bounds are 4–80); band `bandNear < bandFar` (140 < 190) as the test expects sane numbers.

### Tests
none — `tests/content.test.ts` validates the new entry automatically; run `npm run check` and `npm run smoke`.

## Result (attempt 1, yoga)

Added the Divider enemy — a small ink hexagon late-run harasser that kites at a tight 140–190 band and strafes while firing fast, light ink points (speed 260, 6 damage) every 1.4 s, completing the kiting-shooter lineup alongside Sentry and Counterweight. Data-only change: new `src/content/enemies/divider.ts` (hp 16, speed 170, contact 8, threat 2, xp 2, spawns at 200 s with the marginalia "IT HOLDS ITS DISTANCE") plus its alphabetical import and end-of-array registration in `src/content/enemies/index.ts`. No scene, system, or stat changes were required. Both `npm run check` and `npm run smoke` (desktop + mobile) pass.

- Self-review: APPROVE
- Time: 9.6 min

```
game/src/content/enemies/divider.ts | 26 ++++++++++++++++++++++++++
 game/src/content/enemies/index.ts   |  3 ++-
 2 files changed, 28 insertions(+), 1 deletion(-)
```
