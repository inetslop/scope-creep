---
id: T0032
title: Add the Turret enemy
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T21:23:27Z
claimed_at: 2026-10-26T21:28:41Z
finished_at: 2026-10-26T21:43:55Z
---

## Goal
A new enemy archetype — something that holds its ground and punishes you for walking up to it — adding a static shooter to a roster that is otherwise all chasers and one mobile shooter.

## Details
- This is a data-file task modeled on the Sentry. Create `src/content/enemies/turret.ts` by copying `src/content/enemies/sentry.ts` and changing the values. Register it in `ENEMIES` in `src/content/enemies/index.ts` (import in alphabetical position, entry appended in unlock order), exactly like the other enemies.
- Look: a small orange square — `shape: 'square'`, `radius: 18`, `body: PALETTE.orange`, `accent: PALETTE.ink`, `spin: 0.5`. Thick ink outline and the hard paper-cut shadow like every other shape.
- It never moves: it stays exactly where it spawns, does not travel toward the player and does not strafe — it only turns and fires. Reuse the Sentry's shooter behavior configured to hold its ground (a zero/empty distance band and no strafe); if that behavior needs a small data flag or option to be stationary, set or add it as part of this task.
- Fires a fast ink point straight at the player every 1.2 s (the Sentry fires every 2.4 s). Projectile speed 220 (Sentry is 150), projectile damage 10 (Sentry is 8).
- Values: `id: 'turret'`, `name: 'Turret'`, `hp: 50`, `speed: 0`, `contactDamage: 10`, `xp: 4`, `threat: 3`, `spawnWeight: 3`, `unlockAtSec: 150`, `knockbackResist: 0.9` (it barely slides when hit, reinforcing that it holds its ground).
- First-encounter marginalia note (all caps, dry): `HOLDS STILL, SHOTS FAST`.

## Acceptance criteria
- [ ] `src/content/enemies/turret.ts` exists with the values above and `turret` is registered in `ENEMIES`
- [ ] From ~150 s into a run, small orange squares can spawn; before 150 s they never appear
- [ ] A Turret stays in place (no chasing, no strafing) and fires a fast ink point straight at the player roughly every 1.2 s
- [ ] Its projectile is faster and hits harder than the Sentry's (speed 220 vs 150, 10 vs 8 damage)
- [ ] On its first appearance in a run, the marginalia label "HOLDS STILL, SHOTS FAST" fades in above it for 2 s
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/content/enemies/turret.ts` - new `EnemyDef` for the Turret (copy `sentry.ts`, change values)
- edit `src/content/types.ts` - add optional `shoot` tuning to `EnemyDef`
- edit `src/content/enemies/index.ts` - import + register `turret`
- edit `src/entities/Enemy.ts` - use per-enemy fire period (2 lines + 1 getter)
- edit `src/systems/SpawnSystem.ts` - use per-enemy shot speed/damage in `fireShot()`
- edit `tests/content.test.ts` - allow `speed: 0`, validate `shoot` tuning

### Interfaces
Add to `EnemyDef` in `src/content/types.ts` (after `splitsInto`, before `look`):
```ts
  /** Tuning for behavior 'shoot'; omit for the defaults (2.4 s period, speed 150, damage 8). */
  shoot?: {
    /** Seconds between shots. */
    periodSec: number;
    /** Projectile speed, world units per second. */
    speed: number;
    /** Projectile damage. */
    damage: number;
  };
```
Also change the `'shoot'` behavior doc comment to: `/** Holds 240-300 units from the player, strafes, fires ink points (speed 0 = holds its ground). */`

### Steps
1. `src/content/types.ts`: add the `shoot` field above; update the `'shoot'` doc comment.
2. Create `src/content/enemies/turret.ts` exactly:
```ts
import { PALETTE } from '../palette';
import type { EnemyDef } from '../types';

/** Static enemy: a small orange square that never moves and fires fast ink points. */
export const turret: EnemyDef = {
  id: 'turret',
  name: 'Turret',
  note: 'HOLDS STILL, SHOTS FAST',
  hp: 50,
  speed: 0,
  contactDamage: 10,
  xp: 4,
  threat: 3,
  spawnWeight: 3,
  unlockAtSec: 150,
  behavior: 'shoot',
  knockbackResist: 0.9,
  shoot: { periodSec: 1.2, speed: 220, damage: 10 },
  look: { shape: 'square', radius: 18, body: PALETTE.orange, accent: PALETTE.ink, spin: 0.5 },
};
```
3. `src/content/enemies/index.ts`: add `import { turret } from './turret';` between the `tile` and `wedge` imports (alphabetical); change the array to `[wedge, dart, block, hex, sentry, splitter, splinter, mote, boulder, tile, slab, spike, turret]` (append — 150 s is the latest unlock).
4. `src/entities/Enemy.ts`: add a private getter to the class: `private get shootPeriod(): number { return this.def.shoot?.periodSec ?? SHOOT_PERIOD; }`. Replace line 59 `rng.range(0.8, SHOOT_PERIOD)` with `rng.range(0.8, this.shootPeriod)` and line 120 `this.shootTimer = SHOOT_PERIOD;` with `this.shootTimer = this.shootPeriod;`. Do NOT touch `SHOOT_BAND_*` or the strafe math.
5. `src/systems/SpawnSystem.ts` `fireShot()`: before `p.fire(...)`, add `const speed = e.def.shoot?.speed ?? ENEMY_SHOT_SPEED;` and `const damage = e.def.shoot?.damage ?? ENEMY_SHOT_DAMAGE;`, and pass `speed, damage` instead of the constants (keep `ENEMY_SHOT_LIFE`).
6. `tests/content.test.ts`: change line 30 to `expect(nonNegative(e.speed), 'speed >= 0').toBe(true);`. After the `splitsInto` test add:
```ts
  it.each(ENEMIES.filter((e) => e.shoot).map((e) => [e.id, e] as const))('%s shoot tuning is sane', (_id, e) => {
    const s = e.shoot!;
    expect(positive(s.periodSec) && positive(s.speed) && positive(s.damage), 'shoot numbers > 0').toBe(true);
  });
```
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The content test currently asserts `speed > 0` for every enemy — with step 6's change it passes; without it, `npm run check` fails.
- Stationarity is free: in `steer()`'s `'shoot'` case both radial and strafe terms are multiplied by `this.def.speed`, so `speed: 0` means it never moves; knockback still slides it 10% (`knockbackResist: 0.9`). Do not add band/strafe options.
- Marginalia is automatic: `SpawnSystem.spawn()` already calls `run.firstSighting()` + `marginalia.note()` which reads `def.note` (2 s life, above the enemy). Do not wire anything extra. Texture is generated automatically from `look` at boot (ink outline + paper-cut shadow included).
- Import order in `index.ts` is alphabetical (lint enforced); `note` must stay all caps (tested).
- No new pooled objects, listeners, or systems → no invariants or shutdown cleanup needed.
- T0030 (in progress, same assignee) also edits `tests/content.test.ts`; if it is uncommitted when you start, commit/rebase first — your edit there is one line plus one appended test.

### Tests
- `tests/content.test.ts`: the two changes in step 6 (auto-validated by the existing `it.each(ENEMIES)` loops). No `core/` unit tests — all changed logic is Phaser-dependent (entities/systems).

## Result (attempt 1, yoga)

Added the Turret enemy — a static small orange square (hp 50, threat 3, xp 4) that holds its ground and fires fast ink points at the player every 1.2 s (speed 220, damage 10 vs the Sentry's 150/8), unlocking at 150 s with the first-encounter marginalia "HOLDS STILL, SHOTS FAST". It is a data-only addition (`src/content/enemies/turret.ts`, registered in `ENEMIES`) plus a small opt-in `shoot` tuning field on `EnemyDef` that `Enemy.ts` (fire period) and `SpawnSystem.ts` (shot speed/damage) read, with `speed: 0` making it immovable and `knockbackResist: 0.9` so it barely slides. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 15.2 min

```
game/src/content/enemies/index.ts  |  3 ++-
 game/src/content/enemies/turret.ts | 20 ++++++++++++++++++++
 game/src/content/types.ts          | 11 ++++++++++-
 game/src/entities/Enemy.ts         |  7 +++++--
 game/src/systems/SpawnSystem.ts    |  4 +++-
 game/tests/content.test.ts         |  7 ++++++-
 6 files changed, 46 insertions(+), 6 deletions(-)
```
