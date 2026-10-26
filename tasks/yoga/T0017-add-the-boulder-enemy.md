---
id: T0017
title: Add the Boulder enemy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T19:20:22Z
claimed_at: 2026-10-26T19:42:23Z
---

## Goal
A heavy late-game chaser: a big yellow circle that slowly plows toward you and shrugs off knockback — the "yellow = heavy" pillar in a new shape.

## Details
- Create `src/content/enemies/boulder.ts`. Copy `src/content/enemies/block.ts` and change it.
- Values: `id: 'boulder'`, `name: 'Boulder'`, `hp: 60`, `speed: 60`, `contactDamage: 15`, `xp: 4`, `threat: 3`, `spawnWeight: 3`, `unlockAtSec: 90`, `behavior: 'chase'`, `knockbackResist: 0.6`.
- Look: `shape: 'circle'`, `radius: 22`, `body: PALETTE.yellow`, `accent: PALETTE.ink`, `spin: 0`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts` (append to the end of the array).

## Acceptance criteria
- [ ] `src/content/enemies/boulder.ts` exists with exactly the values above
- [ ] `boulder` is in the `ENEMIES` array
- [ ] After 90 s a large yellow circle can appear that slowly chases and barely flinches when hit
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/boulder.ts` - new enemy data (copy of `src/content/enemies/block.ts`)
- edit `src/content/enemies/index.ts` - import `boulder`, append it to `ENEMIES`

### Interfaces
No new types. `EnemyDef` already has every field used; `behavior: 'chase'`, `shape: 'circle'`, `knockbackResist` are all handled by existing code (`Enemy.steer()`, `drawShape()`, `Enemy.ts:151`). Director reads `unlockAtSec`/`threat`/`spawnWeight` from data (`core/director.ts:41-55`). No other file changes.

### Steps
1. Create `src/content/enemies/boulder.ts` with exactly this content:
```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Heavy late-game chaser. A big yellow circle that slowly plows in and barely flinches. */
export const boulder: EnemyDef = {
  id: 'boulder',
  name: 'Boulder',
  hp: 60,
  speed: 60,
  contactDamage: 15,
  xp: 4,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 90,
  behavior: 'chase',
  knockbackResist: 0.6,
  look: {
    shape: 'circle',
    radius: 22,
    body: PALETTE.yellow,
    accent: PALETTE.ink,
    spin: 0,
  },
};
```
2. In `src/content/enemies/index.ts`, add the import in alphabetical position (between `block` and `dart`): `import { boulder } from './boulder';`
3. Append `boulder` to the end of the array: `export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry, splitter, splinter, mote, boulder];`
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Keep the import alphabetical — lint may enforce order; `boulder` goes after `block`.
- Append to the end of `ENEMIES`; do not reorder existing entries.
- Keep `spin: 0` explicit (omitting it would make the circle rotate to face its movement direction).
- All values pass `tests/content.test.ts` ranges (radius 22 in [4,80], knockbackResist 0.6 in [0,1], kebab-case id) — do not "improve" the numbers.
- No pooling, listener, or scene changes: this is data only.

### Tests
- none — `tests/content.test.ts` already validates every `ENEMIES` entry automatically.
