---
id: T0001
title: Add the Hex enemy
assignee: yoga
size: S
priority: 1
status: done
depends_on: []
attempts: 1
claimed_at: 2026-10-26T17:40:32Z
finished_at: 2026-10-26T17:46:50Z
---

## Goal
A new mid-game enemy: a green hexagon that is a bit tougher and faster than a Wedge and shows up after 20 seconds, so the early game gets variety.

## Details
- Create `src/content/enemies/hex.ts`. Copy `src/content/enemies/wedge.ts` and change it.
- Values: `id: 'hex'`, `name: 'Hex'`, `hp: 20`, `speed: 115`, `contactDamage: 10`, `xp: 2`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 20`, `behavior: 'chase'`, `knockbackResist: 0.2`.
- Look: `shape: 'hexagon'`, `radius: 15`, `body: PALETTE.green`, `accent: PALETTE.paperLight`, `spin: -1.5`.
- Register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] `src/content/enemies/hex.ts` exists with exactly the values above
- [ ] `hex` is in the `ENEMIES` array
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, asus)

### Files
- create `src/content/enemies/hex.ts` — new `EnemyDef` data file, copied from `src/content/enemies/wedge.ts`
- edit `src/content/enemies/index.ts` — import `hex` and add it to the `ENEMIES` array

### Interfaces
No new types or functions. `hex.ts` exports one constant, exactly:

```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Mid-game fodder: a green hexagon that spins as it chases. Tougher and faster than the wedge. */
export const hex: EnemyDef = {
  id: 'hex',
  name: 'Hex',
  hp: 20,
  speed: 115,
  contactDamage: 10,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 20,
  behavior: 'chase',
  knockbackResist: 0.2,
  look: {
    shape: 'hexagon',
    radius: 15,
    body: PALETTE.green,
    accent: PALETTE.paperLight,
    spin: -1.5,
  },
};
```

In `index.ts`: add `import { hex } from './hex';` (between the `dart` and `wedge` imports, keeping them alphabetical) and change line 7 to `export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex];`.

### Steps
1. Copy `src/content/enemies/wedge.ts` to `src/content/enemies/hex.ts`, then replace its entire contents with the block above.
2. Edit `src/content/enemies/index.ts`: add the import line, append `hex` to the `ENEMIES` array.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The exported constant must be named `hex` to match the import in `index.ts`; the file is `hex.ts`.
- Do not add anything else: `art/textures.ts` (line 55) and `systems/SpawnSystem.ts` (line 16) already iterate `ENEMIES`, so the texture and spawn director pick it up automatically. `hexagon` is already implemented in `src/art/shapes.ts` (line 41) and `'chase'` exists in `EnemyBehavior` — no code changes needed.
- Do not invent a new palette color: `PALETTE.green` (0x2e7d55) already exists in `src/content/palette.ts`.
- Keep every value exactly as specified — `tests/content.test.ts` validates all fields (knockbackResist must stay in [0,1], radius in [4,80]).
- Do not edit `CLAUDE.md`, `docs/ARCHITECTURE.md`, or any file in `core/`, `entities/`, `systems/`, or `scenes/`.

### Tests
- none — `tests/content.test.ts` already validates every entry in `ENEMIES` automatically, and no pure logic in `src/core` changes.

## Result (attempt 1, yoga)

Added the Hex enemy as a new data file `src/content/enemies/hex.ts` — a green hexagon (hp 20, speed 115, contact damage 10, 2 XP, threat 2, weight 4, unlocks at 20s, chase behavior, knockbackResist 0.2, radius 15, spin -1.5) — and registered it in `ENEMIES` in `src/content/enemies/index.ts` with the import kept alphabetical. The texture and spawn director pick it up automatically via `ENEMIES` iteration, so no other files changed. `npm run check` (typecheck + lint + 35 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 6.3 min

```
game/src/content/enemies/hex.ts   | 24 ++++++++++++++++++++++++
 game/src/content/enemies/index.ts |  3 ++-
 2 files changed, 26 insertions(+), 1 deletion(-)
```
