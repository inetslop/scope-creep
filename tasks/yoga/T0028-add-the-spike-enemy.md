---
id: T0028
title: Add the Spike enemy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:55:07Z
claimed_at: 2026-10-26T21:02:42Z
---

## Goal
A small, fast red punisher: hugging the swarm gets you stung.

## Details
- Create `src/content/enemies/spike.ts`. Copy `src/content/enemies/hex.ts` (the same chase-behavior pattern as Tile and Slab) and change the values.
- Values: `id: 'spike'`, `name: 'Spike'`, `hp: 10`, `speed: 130`, `contactDamage: 14`, `xp: 2`, `threat: 2`, `spawnWeight: 5`, `unlockAtSec: 75`, `behavior: 'chase'`, `knockbackResist: 0.1`.
- Look: `shape: 'triangle'` (the same shape value `splinter` uses), `radius: 10`, `body: PALETTE.red`, `accent: PALETTE.paperLight`, `spin: 1.5`.
- Never splits (no `splitsInto` field).
- Register it in `ENEMIES` in `src/content/enemies/index.ts` with the import in alphabetical position, exactly like the Tile and Slab entries.
- No engine changes: the `chase` behavior and the triangle texture already exist.

## Acceptance criteria
- [ ] `src/content/enemies/spike.ts` exists with exactly the values above and no `splitsInto` field
- [ ] `spike` is in the `ENEMIES` array
- [ ] From ~75 s into a run, small red spinning triangles can appear that chase the player and hurt 14 on contact
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/spike.ts` - the Spike enemy definition (data only, copied from `hex.ts` structure)
- edit `src/content/enemies/index.ts` - import spike and append it to `ENEMIES`

### Interfaces
No new types or functions. `spike: EnemyDef` exactly as in `hex.ts`.

### Steps
1. Create `src/content/enemies/spike.ts` with exactly this content:
```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Small fast punisher: a red spinning triangle that chases. Hugging the swarm gets you stung. */
export const spike: EnemyDef = {
  id: 'spike',
  name: 'Spike',
  hp: 10,
  speed: 130,
  contactDamage: 14,
  xp: 2,
  threat: 2,
  spawnWeight: 5,
  unlockAtSec: 75,
  behavior: 'chase',
  knockbackResist: 0.1,
  look: {
    shape: 'triangle',
    radius: 10,
    body: PALETTE.red,
    accent: PALETTE.paperLight,
    spin: 1.5,
  },
};
```
2. In `src/content/enemies/index.ts`, add `import { spike } from './spike';` between the `slab` and `splinter` imports (alphabetical position).
3. In the same file, change line 15 to append `spike` at the end of the array:
`export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry, splitter, splinter, mote, boulder, tile, slab, spike];`
4. Run `npm run check`, then `npm run smoke`. Stop and report if either fails.

### Pitfalls
- Do NOT add a `splitsInto` field (acceptance criterion says it must be absent).
- The `ENEMIES` array is in unlock order, not alphabetical — append at the end, do not sort. Only the imports are alphabetical.
- Do not touch `textures.ts`, `director.ts`, `SpawnSystem.ts`, or `Enemy.ts` — the triangle texture and `chase` steer are generated/implemented automatically from the def.
- Do not edit any other enemy file or `types.ts`.

### Tests
- none (the existing `tests/content.test.ts` iterates `ENEMIES` and validates spike's numbers, id, and kebab-case automatically; there is no new pure logic in `core/`).
