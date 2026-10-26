---
id: T0010
title: Add the Mote enemy
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T17:40:33Z
---

## Goal
A tiny fast circle that shows up in numbers — swarm pressure in the mid-game.

## Details
- Create `src/content/enemies/mote.ts`. Copy `src/content/enemies/wedge.ts` and change it.
- Values: `id: 'mote'`, `name: 'Mote'`, `hp: 6`, `speed: 150`, `contactDamage: 4`, `xp: 1`, `threat: 1`, `spawnWeight: 8`, `unlockAtSec: 45`, `behavior: 'chase'`, `knockbackResist: 0`.
- Look: `shape: 'circle'` (same shape as the player), `radius: 7`, `body: PALETTE.ink`, `accent: PALETTE.paperLight`, `spin: 0`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] `src/content/enemies/mote.ts` exists with exactly the values above
- [ ] `mote` is in the `ENEMIES` array
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, asus)

### Files
- create `src/content/enemies/mote.ts` - the new enemy, pure data (copy of `wedge.ts`)
- edit `src/content/enemies/index.ts` - import `mote` and add it to `ENEMIES`

### Interfaces
No new types or functions. `mote` is an existing `EnemyDef` (verified in `src/content/types.ts`); all fields in the task exist. `PALETTE.ink` and `PALETTE.paperLight` exist in `src/content/palette.ts`.

### Steps
1. Create `src/content/enemies/mote.ts` with exactly this content:

```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** A tiny fast swarm circle that appears in numbers mid-run. Ink body, paper eye. */
export const mote: EnemyDef = {
  id: 'mote',
  name: 'Mote',
  hp: 6,
  speed: 150,
  contactDamage: 4,
  xp: 1,
  threat: 1,
  spawnWeight: 8,
  unlockAtSec: 45,
  behavior: 'chase',
  knockbackResist: 0,
  look: {
    shape: 'circle',
    radius: 7,
    body: PALETTE.ink,
    accent: PALETTE.paperLight,
    spin: 0,
  },
};
```

2. Edit `src/content/enemies/index.ts`:
   - Add the import line `import { mote } from './mote';` between `import { hex } from './hex';` and `import { sentry } from './sentry';` (imports stay alphabetical).
   - Change line 11 to: `export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry, splitter, splinter, mote];` (append last — the array is ordered by unlock time and mote unlocks at 45 s, the latest).
3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Keep `spin: 0` exactly — it is `0`, not omitted. Omitted means the sprite turns to face its movement (`Enemy.steer()` line 132); `0` is defined so rotation stays 0 (set in `spawn()`). No NaN risk.
- Do not add `splitsInto` or any other field; do not copy `wedge`'s numbers into `mote`.
- No code changes needed elsewhere: the texture is generated automatically for `circle` in `drawEnemy()` (`src/art/textures.ts`), `Enemy` pools by def, and `SpawnDirector` reads `threat`/`spawnWeight`/`unlockAtSec` generically.
- No new system, so no `hook.addInvariant()` needed; nothing to clean up.

### Tests
- none — `tests/content.test.ts` validates every entry of `ENEMIES` automatically (id kebab-case, hp/speed/threat > 0, radius in [4,80], knockbackResist in [0,1]); all mote values pass.
