---
id: T0250
title: "The leak echo: a ghost of the leaker walks back up the road"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T01:33:38Z
---

## Goal
When an enemy leaks, a ghost of it walks back up the road from the exit, so the player sees exactly which enemy got through — the exit warning and the jolt never say that.

## Details
- The moment an enemy leaks (reaches the exit), one ghost of its token spawns at the exit: the leaker's exact shape, color and size at 40% alpha — no health bar, no chips or marks, no interaction. It can never be targeted, hit or affected by anything.
- The ghost walks backward along the road (toward the entrance) at a constant 2.5 cells/s for 2.0 s, then fades out over 0.5 s — about 5 cells of road in 2.5 s total. It is display-only: it pays no gold, costs no life, triggers no leak warning, never counts in the wave's enemy total, and never feeds Mint, Toll or the combo.
- At most 3 ghosts on the board at once; a leak while three are alive skips the echo. Ghosts are live-wave transients: a resumed run shows none.
- No new sound (the leak's jolt and the warning's tick already carry the moment), no new input, no HUD element: the ghost is a board transient like the wave's last-kill ring (T0229) — it replaces nothing and leaves the board exactly as it was when it fades.
- A new leak-hook file on the comboBreak pattern (src/systems/enemyHooks/comboBreak.ts, registered in the hook index): the hook spawns the ghost, which reuses the enemy token's painter at the ghost's alpha. The leak's own effects (life, gold, jolt, warning, combo break, Toll payment) are untouched.

## Acceptance criteria
- [ ] Every leak spawns one ghost of the leaker's token at the exit (same shape, color and size as on board, 40% alpha) that walks toward the entrance at a steady speed for 2.0 s and fades over 0.5 s; the leak's life cost, gold, jolt, warning, combo break and Toll payment are byte-identical to before.
- [ ] The ghost is inert: no tower targets or hits it, it triggers no warning, the next-wave button's count and the wave's flow are unchanged, and a run resumed after a leak shows no ghost.
- [ ] A run in which four enemies leak in quick succession shows at most 3 ghosts at once; a run that leaks at least once passes the desktop and mobile smoke tests.

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/leakEcho.ts` - the leak echo hook: on `onLeak`, spawns a 40%-alpha ghost of the leaker's token at the path end and walks it back up the road via scene tweens
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` list line, both next to `comboBreak`

### Interfaces
No new types. One new export:
```ts
export const leakEcho: MakeEnemyHook; // in src/systems/enemyHooks/leakEcho.ts
```
Everything else is already in place: `MakeEnemyHook`/`EnemyHookContext` (`systems/enemyHooks/hook.ts`), `Board.path: PathLine` (`core/path.ts`, `pointAt(d)` clamps to both ends, `length`), `enemyTexture(id)` and `artScale(img)` (`art/textures.ts`), `DEPTH.enemies = 20`, `CELL = 64` (`config.ts`). `EnemySystem`'s constructor already maps `ENEMY_HOOKS` fresh per run, so the index line is the whole wiring — do NOT touch GameScene, EnemySystem or FxSystem.

### Steps
1. Create `src/systems/enemyHooks/leakEcho.ts` with exactly this content:
```ts
import { CELL, DEPTH } from '../../config';
import { artScale, enemyTexture } from '../../art/textures';
import type { MakeEnemyHook } from './hook';

/** ms the ghost walks back up the road, then it fades over FADE_MS. */
const WALK_MS = 2000;
const FADE_MS = 500;
/** Cells per second the ghost walks back toward the entrance (~5 cells in 2.0 s). */
const GHOST_SPEED = 2.5;
/** At most this many ghosts at once; a leak while they are all alive skips the echo. */
const MAX_GHOSTS = 3;

/**
 * The leak echo: a ghost of the leaker's token (its shape, color and size at 40% alpha) walks
 * back up the road from the exit toward the entrance, so the player sees which enemy got
 * through. Display-only: it is no enemy (never targeted or counted), pays nothing and triggers
 * nothing; the leak's own effects (life, gold, jolt, warning, combo break, toll) are untouched.
 * It is a live-run transient (a scene object, never saved): a resumed run shows none.
 */
export const leakEcho: MakeEnemyHook = ({ scene, board, fx }) => {
  let live = 0;
  return {
    onLeak(enemy) {
      if (live >= MAX_GHOSTS || fx.full) return;
      live += 1;
      const path = board.path;
      const start = path.pointAt(path.length);
      const ghost = artScale(scene.add.image(start.x, start.y, enemyTexture(enemy.def.id)))
        .setDepth(DEPTH.enemies)
        .setAlpha(0.4);
      scene.tweens.add({
        targets: { d: path.length },
        d: Math.max(0, path.length - GHOST_SPEED * CELL * (WALK_MS / 1000)),
        duration: WALK_MS,
        ease: 'Linear',
        onUpdate: (_tween, _target, _key, d) => {
          const p = path.pointAt(d);
          ghost.setPosition(p.x, p.y);
        },
        onComplete: () => {
          scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: FADE_MS,
            ease: 'Quad.easeOut',
            onComplete: () => {
              live -= 1;
              ghost.destroy();
            },
          });
        },
      });
    },
  };
};
```
2. Edit `src/systems/enemyHooks/index.ts`: add `import { leakEcho } from './leakEcho';` directly after the `comboBreak` import (line 2), and add `  leakEcho,` directly after `  comboBreak,` in `ENEMY_HOOKS`.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Drive the ghost with **scene tweens, not the hook's `update(dt)`**: `RunFlow` only calls `enemies.update` (hence hook `update`) in phase `'wave'`, so a ghost whose leaker was the wave's last enemy would freeze mid-road through draft/build and jump when the next wave starts. Scene tweens run in every phase, pause with the pause menu, and die with the scene on game over/resume.
- Do not use `fx.track()`: it tweens only to final props and can't follow the path; the ghost has its own cap of 3 and must not count against FxSystem's 160-effect budget. The `fx.full` guard at spawn is just a skip.
- Do not add the ghost to the enemy pool or touch `Enemy`/`EnemySystem`: a plain `Image` is automatically never targeted, never in `aliveCount` (next-wave button), never in the save (resumed run shows none), never feeds Mint/Toll/combo.
- Spawn the image already at `start` (the path end, where the leak ring and jolt happen) so there is no one-frame flash at the origin.
- No rotation (the token's shading is painted at the bottom), no tint (a leaker caught mid hit-flash is white; the ghost shows the token's own color), no plate/mark/health bar.
- `live -= 1` happens only in the fade tween's `onComplete`; never destroy the ghost earlier or the cap counts it forever (state is per-run, but keep it clean).
- Paths shorter than 5 cells: the `Math.max(0, …)` clamp (and `pointAt`'s own clamp) makes the ghost stop at the entrance and fade there.
- 2x run speed does not affect the ghost — it is real-time, like every fx in FxSystem; that is intended.
- Do NOT add a line to `debug/runChecks.ts`: this is a hook (like comboBreak/haulerLeak, no invariant), the cap is enforced at spawn, and T0239 is editing that file right now.

### Tests
- none (no rule in src/core is added or changed; `tests/content.test.ts` is unaffected)
