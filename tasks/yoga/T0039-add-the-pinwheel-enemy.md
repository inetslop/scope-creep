---
id: T0039
title: Add the Pinwheel enemy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T22:44:02Z
claimed_at: 2026-10-26T22:57:36Z
---

## Goal
A new late-run enemy for variety — a red square that spins fast while chasing, reading at a glance as "spinning danger" and adding a new shape to the mid/late pack.

## Details
- This is a data-file task modeled on an existing chaser. Create `src/content/enemies/pinwheel.ts` by copying `src/content/enemies/tile.ts` (a square chaser) and changing the values. Register it in `ENEMIES` in `src/content/enemies/index.ts` (import in alphabetical position, entry appended in unlock order — 165 s is the latest unlock), exactly like the other enemies.
- Look: a red square — `shape: 'square'`, `radius: 14`, `body: PALETTE.red`, `accent: PALETTE.ink`, `spin: 2.4` (fast spin — its defining trait; the Spike spins at 1.5). Thick ink outline and the hard paper-cut shadow like every other shape.
- Behavior: `chase` — it travels straight toward the player like the Tile and Hex.
- Values: `id: 'pinwheel'`, `name: 'Pinwheel'`, `hp: 24`, `speed: 112`, `contactDamage: 11`, `xp: 2`, `threat: 2`, `spawnWeight: 4`, `unlockAtSec: 165`, `knockbackResist: 0.3`.
- First-encounter marginalia note (all caps, dry): `SPINS AS IT CHASES`.

## Acceptance criteria
- [ ] `src/content/enemies/pinwheel.ts` exists with the values above and `pinwheel` is registered in `ENEMIES`
- [ ] From ~165 s into a run, red spinning squares can spawn; before 165 s they never appear
- [ ] A Pinwheel chases the player straight and spins fast (visibly rotating) as it moves, unlike the non-spinning Mote
- [ ] On its first appearance in a run, the marginalia label "SPINS AS IT CHASES" fades in above it for 2 s
- [ ] The spawn unlock timing test still passes (Pinwheel absent before 165 s, present at/after)
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/pinwheel.ts` — new `EnemyDef`, copied from `src/content/enemies/tile.ts` (square chaser), values changed per task
- edit `src/content/enemies/index.ts` — one import line + one array entry

### Interfaces
None. `EnemyDef` already exists (`src/content/types.ts`). Texture is generated automatically from `ENEMIES` in `src/art/textures.ts`; spin is applied per-frame in `src/entities/Enemy.ts:179` (`rotation += spin * dt`); marginalia note is shown automatically on first sighting (`src/systems/SpawnSystem.ts:85`). No other code changes.

### Steps
1. Create `src/content/enemies/pinwheel.ts` with exactly:
```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Late-run chaser: a red square that spins fast as it closes in. */
export const pinwheel: EnemyDef = {
  id: 'pinwheel',
  name: 'Pinwheel',
  note: 'SPINS AS IT CHASES',
  hp: 24,
  speed: 112,
  contactDamage: 11,
  xp: 2,
  threat: 2,
  spawnWeight: 4,
  unlockAtSec: 165,
  behavior: 'chase',
  knockbackResist: 0.3,
  look: {
    shape: 'square',
    radius: 14,
    body: PALETTE.red,
    accent: PALETTE.ink,
    spin: 2.4,
  },
};
```
2. In `src/content/enemies/index.ts`, add `import { pinwheel } from './pinwheel';` between the `mote` and `sentry` imports (alphabetical).
3. In the same file, change line 18 to insert `pinwheel` in unlock order between `turret` (150 s) and `frameWedge` (300 s):
```ts
export const ENEMIES: readonly EnemyDef[] = [wedge, dart, block, hex, sentry, splitter, splinter, mote, boulder, tile, slab, spike, turret, pinwheel, frameWedge];
```
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The task says "165 s is the latest unlock" — it is not: `frameWedge` unlocks at 300 s. Do not append at the end; insert between `turret` and `frameWedge` as above.
- Do not reorder or reformat the other entries in `ENEMIES`; the tests only care about membership, but keep the diff one line.
- `note` must stay all caps (`SPINS AS IT CHASES`) — `tests/content.test.ts` rejects mixed case.
- `spin: 2.4` is radians/sec (Spike's 1.5 is the reference); it is dt-based in `Enemy.ts`, so no frame-rate work needed. `mote` uses `spin: 0` (never rotates) — the visual contrast is automatic.
- No pooling, scene, or input code is touched: nothing to clean up on shutdown.

### Tests
None to add. The generic `it.each(ENEMIES)` suites in `tests/content.test.ts` (sane numbers, note caps) and `tests/content/spawn.test.ts` (absent at 164 s, present at 165 s and 600 s) pick up the new enemy automatically.
