---
id: T0125
title: Fermata — the shapes hold their breath when you pick
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T15:42:50Z
claimed_at: 2026-10-27T19:37:46Z
finished_at: 2026-10-27T19:52:51Z
---

## Goal
The level-up is the one moment a run stops to ask you a question — it should feel like a held breath: when the game resumes after you pick a card, every shape on the page holds still for 0.6 s while you can already move and fire.

## Details
- The trigger: the moment a level-up card is confirmed — the same moment the level-up pulse fires (T0102) and The Index updates (T0104).
- The hold: from the moment the game resumes after the pick, for exactly 0.6 s: every enemy (normal, elite and boss minion), every enemy bullet, and the boss and its parts stop where they are. Boss attack timers pause too — The Grid's arms freeze mid-sweep, The Frame halts mid-charge, The Press's wall and stamp telegraph stop, The Palette's swatches stop falling — and every pattern resumes exactly where it left off when the hold ends (no repeated telegraphs, no skipped strikes, no boss state desync).
- The page keeps breathing: the player moves and fires normally during the hold; player bullets fly and can kill frozen enemies; shards, the Gutter's sweep (T0099), the Crop's shrink (T0045), the run clock, the music and the Inkwell all advance normally. No new enemies or bosses spawn during the hold — the spawner holds with the shapes.
- Two quick picks in a row (a shard burst) give one fresh 0.6 s from the later pick — the hold never stacks or extends.
- No extra art, sound, HUD, key or scene for the hold itself: you move and everything else is still, and that is the legibility. The hold timing (start, retrigger, expiry) is a small pure state with a unit test.

## Acceptance criteria
- [ ] Picking any level-up card: from the moment the game resumes, all enemies, enemy bullets, and the boss and its parts are motionless for exactly 0.6 s, after which everything resumes.
- [ ] During the hold the player moves and fires; a fired projectile flies and can kill a frozen enemy; shards and active hazards (the Gutter) keep moving; the run timer and music keep running.
- [ ] A boss mid-pattern holds: The Grid's arms are frozen mid-sweep and resume exactly where they left off; the same for The Frame's charge and The Press's wall/stamp.
- [ ] Two picks in quick succession give one fresh 0.6 s hold from the later pick, never stacking; no new HUD element, key, sound or scene is added; `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/core/fermata.ts` - pure hold timing (constant + class), no Phaser import
- create `src/systems/FermataSystem.ts` - physics side of the freeze: zeros velocities, stores/restores the one-shot ones
- create `tests/core/fermata.test.ts` - unit tests for start / retrigger / expiry
- edit `src/core/run.ts` - import + one `readonly fermata` field (run.ts is touched by other tasks, but this is one isolated line)
- edit `src/scenes/LevelUpScene.ts` - one line in `choose()`: arm the hold at the pick moment
- edit `src/scenes/GameScene.ts` - import, field, construction, the update() gate, two invariants

### Interfaces
```ts
// src/core/fermata.ts
export const FERMATA_SEC = 0.6;
export class Fermata {
  get active(): boolean;      // left > 0
  get leftSec(): number;      // seconds remaining, clamped at 0
  arm(): void;                // (re)starts the FULL window — never adds to what is left
  update(dt: number): boolean; // advances dt; true exactly on the frame it expires
}
// src/systems/FermataSystem.ts
export class FermataSystem {
  constructor(run: RunState);  // no scene: it owns no game objects
  get savedCount(): number;
  update(dt: number, enemies: Phaser.Physics.Arcade.Group, enemyShots: Phaser.Physics.Arcade.Group, boss: Boss): boolean; // true while holding
}
// run.ts:  /** The fermata: after a level-up pick, the shapes hold still for 0.6 s from the resume. */
//          readonly fermata = new Fermata();   // next to `inkwell = 0;`
```

### Steps
1. Write `core/fermata.ts`: `private left = 0`; `arm()` sets `left = FERMATA_SEC`; `update` returns `false` if `left <= 0`, else `left -= dt`, clamps to 0, returns `left <= 0`.
2. Write `tests/core/fermata.test.ts` (model `tests/core/slam.test.ts`): FERMATA_SEC is 0.6; arm → active; 0.3+0.2+0.1 expires on the third; a single 0.6 update expires; retrigger at 0.3 consumed gives a FRESH 0.6 (expires at 0.6 after, not 0.9); update while inactive is a no-op; oversized dt (5 s) expires, never wraps negative.
3. Write `FermataSystem`: `private saved = new Map<object, {x:number;y:number}>(); private frozen = false;` In `update`: if `run.fermata.active && !this.frozen` → `freeze(...)`; then `run.fermata.update(dt)`; if `!run.fermata.active && this.frozen` → `release()`; `this.frozen = run.fermata.active; return run.fermata.active;`.
   `freeze`: for each **active** enemy body → `setVelocity(0, 0)` only (NOT saved — `steer()` re-sets it the first unfrozen frame); for each **active** enemy bullet and the boss body (if `boss.active`) → save `{x: body.velocity.x, y: body.velocity.y}` then `setVelocity(0, 0)`.
   `release`: for each ledger entry, if `obj.active` and body enabled → `setVelocity(saved)`; `saved.clear()`.
4. `run.ts`: add `import { Fermata } from './fermata';` (before the progression import) and the field.
5. `LevelUpScene.choose()`: after `getPlayer(this).pulse();` add exactly `getRun(this).fermata.arm(); // the shapes hold their breath for 0.6 s from the resume (T0125)`.
6. `GameScene`: add field `private fermata!: FermataSystem;` after `private spawns!: SpawnSystem;`; in `create()` add `this.fermata = new FermataSystem(this.run);` after the `this.spawns = ...` line; in `update()` replace the three lines `this.spawns.update(dt); this.underdrawing.update(dt); this.boss.update(dt);` with:
```ts
    // Fermata: after a level-up pick every enemy shape holds still for 0.6 s; player,
    // their weapons, shards and hazards keep moving (core/fermata.ts).
    const holding = this.fermata.update(dt, this.spawns.enemies, this.spawns.enemyShots, this.boss.boss);
    if (!holding) {
      this.spawns.update(dt);
      this.underdrawing.update(dt);
      this.boss.update(dt);
    }
```
7. In `registerInvariants()` add after the `enemy-shot-count` invariant: `'fermata-hold'` — early-return `null` if `this.ending || !this.scene.isActive() || !this.run.fermata.active`; else loop active enemies and active enemy bullets and fail if `body.velocity.x !== 0 || body.velocity.y !== 0`, and fail if the active boss body has non-zero velocity; `'fermata-ledger'` — fail if `this.fermata.savedCount > this.spawns.maxEnemies + this.spawns.maxEnemyShots + 1`.

### Pitfalls
- Never `physics.pause()` or disable bodies: overlaps must keep working so player bullets kill frozen enemies. Zeroing velocity is the only freeze.
- Do NOT save/restore enemy velocities — `steer()` runs on the release frame before the physics step, so restoring risks writing a killed parent's old velocity onto its pooled object reused as a split child.
- Gating the director also pauses its threat budget (good: no post-hold spawn burst). Gating `underdrawing` with the spawner stops announced sketches fading out mid-hold.
- Kill-during-hold: split children appear frozen (velocity 0, no steer) and burst on the first unfrozen frame — expected, don't gate `CombatSystem.split`.
- The Press (T0116) is not in this tree yet: the gate freezes everything `BossSystem.update` drives plus the boss body velocity. If T0116 lands first and its wall/stamp parts are a separate moving group, pass it to `FermataSystem.update` like `enemyShots` (save + restore).
- Elite ring spin (`Enemy.preUpdate`) and marginalia/puddle aging keep going — decorative layers, the "page keeps breathing"; do not edit Enemy.ts.
- A hold paused by ESC continues its remainder after unpause; the timer only ticks in `GameScene.update`, so it never runs while an overlay is open — that is what makes "fresh 0.6 s from the later pick" hold.

### Tests
- `tests/core/fermata.test.ts` as listed in step 2 (start, retrigger/no-stacking, expiry, no-op, clamp).

## Result (attempt 1, desktop)

Added the fermata — a 0.6 s held breath after every level-up pick: pure timing state in `src/core/fermata.ts` (armed from `LevelUpScene.choose()`, ticked by the run clock), a `FermataSystem` that freezes enemies, enemy bullets and the boss by zeroing velocities (bullets and boss restored from a ledger, so boss patterns like the Grid sweep, Frame dash and Palette cascade resume exactly where they left off), and a gate in `GameScene.update()` that pauses the spawner, underdrawing and boss director while the player, shards and hazards keep moving. Two invariants (`fermata-hold`, `fermata-ledger`) guard the frozen state, and 10 unit tests cover arm/retrigger/expiry/no-op/clamp; `npm run check` (273 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 15.1 min

```
game/src/core/fermata.ts          | 36 ++++++++++++++++
 game/src/core/run.ts              |  3 ++
 game/src/scenes/GameScene.ts      | 39 +++++++++++++++--
 game/src/scenes/LevelUpScene.ts   |  1 +
 game/src/systems/FermataSystem.ts | 63 +++++++++++++++++++++++++++
 game/tests/core/fermata.test.ts   | 89 +++++++++++++++++++++++++++++++++++++++
 6 files changed, 228 insertions(+), 3 deletions(-)
```
