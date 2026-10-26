---
id: T0025
title: Add the Slab enemy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0023]
attempts: 1
created: 2026-10-26T20:32:24Z
claimed_at: 2026-10-26T20:34:07Z
---

## Goal
A slow, huge, heavy wall for late runs: after 2:00 a big yellow square crawls across the page that you can barely push and that hurts to touch — a positioning threat, not a chase threat.

## Details
- Create `src/content/enemies/slab.ts`. Copy `src/content/enemies/boulder.ts` and change it: keep `behavior: 'chase'` and the same overall structure, but use the square shape (the same shape value `tile.ts` uses) and the values below.
- Values: `id: 'slab'`, `name: 'Slab'`, `hp: 140`, `speed: 45`, `contactDamage: 18`, `xp: 6`, `threat: 4`, `spawnWeight: 2`, `unlockAtSec: 120`, `behavior: 'chase'`, `knockbackResist: 0.8`.
- Look: `radius: 24`, `body: PALETTE.yellow`, `accent: PALETTE.ink`, `spin: 0.1`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array, same import/entry style as the others).
- It drops normal shards; no special drops, no splitting.

## Acceptance criteria
- [ ] `src/content/enemies/slab.ts` exists with exactly the values above
- [ ] `slab` is in the `ENEMIES` array
- [ ] After 120 s a big yellow square can appear that crawls slowly, shrugs off knockback almost completely, and hurts more on contact than a Boulder
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/slab.ts` - new enemy data, exact copy of `boulder.ts` structure with the values below
- edit `src/content/enemies/index.ts` - add the import and append `slab` to the `ENEMIES` array

### Interfaces
None. `EnemyDef` is unchanged; `shape: 'square'` and `behavior: 'chase'` already exist in `src/content/types.ts`.

### Steps
1. Create `src/content/enemies/slab.ts` with exactly this content:
```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Huge slow wall for late runs. A big yellow square that barely moves and hurts to touch. */
export const slab: EnemyDef = {
  id: 'slab',
  name: 'Slab',
  hp: 140,
  speed: 45,
  contactDamage: 18,
  xp: 6,
  threat: 4,
  spawnWeight: 2,
  unlockAtSec: 120,
  behavior: 'chase',
  knockbackResist: 0.8,
  look: {
    shape: 'square',
    radius: 24,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0.1,
  },
};
```
2. In `src/content/enemies/index.ts`: add `import { slab } from './slab';` in the import block (alphabetical: between `sentry` and `splinter`), and append `slab` after the last entry of the `ENEMIES` array (line 13 — after `boulder`, or after `tile` if T0023 has already landed).
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `knockbackResist` is a **required** field — omitting it fails typecheck.
- Do NOT add `splitsInto` — it is optional and the task says no splitting; omit the key entirely.
- Do NOT touch `types.ts`, `textures.ts`, `Enemy.ts`, or any system — texture and behavior are fully data-driven.
- `index.ts` is also edited by T0023 (in progress): do this task only after T0023 is done, and re-read the array's current tail before appending.
- No `Math.random`, no dt, no pooling concerns — this is a pure data file.

### Tests
- None. `tests/content.test.ts` validates `slab` automatically (all values are within its checked ranges).
