---
id: T0023
title: Add the Tile enemy
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T20:18:38Z
---

## Goal
A mid-tier chaser in a new shape: a green square that chases at medium speed — steady pressure between the fast Hex and the slow Boulder.

## Details
- Create `src/content/enemies/tile.ts`. Copy `src/content/enemies/splitter.ts` and change it: keep the square shape value and the ink accent from splitter, but remove the `splitsInto` field so it never splits on death.
- Values: `id: 'tile'`, `name: 'Tile'`, `hp: 35`, `speed: 95`, `contactDamage: 12`, `xp: 3`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 105`, `behavior: 'chase'`, `knockbackResist: 0.3`.
- Look: `radius: 16`, `body: PALETTE.green`, `accent: PALETTE.ink`, `spin: 0.4`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array).

## Acceptance criteria
- [ ] `src/content/enemies/tile.ts` exists with exactly the values above and no `splitsInto` field
- [ ] `tile` is in the `ENEMIES` array
- [ ] After 105 s a green square can appear that chases at medium speed and never splits on death
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/tile.ts` - new enemy data (copy of `splitter.ts`, values below)
- edit `src/content/enemies/index.ts` - import `tile`, append it to `ENEMIES`

### Interfaces
No new types. `EnemyDef` (`src/content/types.ts`) already covers this: `splitsInto` is optional, so omitting it means "never splits" — no engine changes needed. `PALETTE.green` exists (`0x2e7d55`).

### Steps
1. Create `src/content/enemies/tile.ts` with exactly this content:

```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Mid-tier chaser: a green square that closes in at medium speed. Never splits. */
export const tile: EnemyDef = {
  id: 'tile',
  name: 'Tile',
  hp: 35,
  speed: 95,
  contactDamage: 12,
  xp: 3,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 105,
  behavior: 'chase',
  knockbackResist: 0.3,
  look: {
    shape: 'square',
    radius: 16,
    body: PALETTE.green,
    accent: PALETTE.ink,
    spin: 0.4,
  },
};
```

2. Edit `src/content/enemies/index.ts`: add `import { tile } from './tile';` after the `splitter` import (line 9), and change line 13 to end with `..., boulder, tile];` (append `tile` to the end of the `ENEMIES` array).
3. Run `npm run check`, then `npm run smoke`. Both must pass. Do not run `npm run dev`.

### Pitfalls
- The task text says "keep the ink accent from splitter", but splitter's accent is `PALETTE.paperLight`. Use the explicit value given: `accent: PALETTE.ink` (as in the snippet). Do not "fix" it to paperLight.
- Do not add a `splitsInto` field — its absence is what makes it never split.
- Keep the import between `splitter` and `wedge` (alphabetical, matches existing style).
- No systems, scenes, or pooling changes: `Enemy.steer()` already handles `'chase'` and the texture is generated automatically from `look` in Boot.

### Tests
- none (the existing `tests/content.test.ts` validates `tile` automatically: id, numbers, radius bounds)
