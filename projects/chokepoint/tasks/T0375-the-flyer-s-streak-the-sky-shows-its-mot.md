---
id: T0375
title: "The Flyer's streak: the sky shows its motion"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T19:38:40Z
epic: E10
---

## Goal
A first-time player reads the Flyer as moving through the air, not walking the road: a short fading streak trails it while it crosses.

## Details
- While a regular (non-boss) Flyer is in the sky, a short flat streak trails behind it, stretched along its current motion, in the Flyer's own body color.
- The streak is ~1.5× the Flyer's token length, tapers to a point at its back, ~25% alpha, and re-derives each frame so it always points where the Flyer came from. It sits at ground level under the Flyer's token, like a motion afterimage.
- Display only: no sound, no text, no chip, no hitbox. It does not change the Flyer's flight line, hp, speed, gold or threat.
- The Flyer's direction comes from its existing flight velocity (set by T0353's crossing); the hook reads it, it adds no new enemy fields.
- Closest example: the Dasher's surge streak (T0328) — same flat, soft, color-of-the-enemy language.
- Bright minimal: a flat soft shape in the Flyer's color; no glow, no gradient, no outline.

## Acceptance criteria
- [ ] While a regular Flyer flies, a flat streak in its own color trails behind it along its motion, updating every frame.
- [ ] The streak is absent before the Flyer spawns and the instant it dies or leaks.
- [ ] The wave-50 boss Flyer is untouched (it keeps its own telegraph); the streak applies to the regular Flyer only.
- [ ] No sound, text, chip, or gameplay change; the rest of the game is byte-identical.
- [ ] Typecheck, lint, unit tests, and the desktop/mobile smoke pass.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/flyerStreak.ts` - the per-frame streak hook, modelled on `src/systems/enemyHooks/dasherStreak.ts`
- edit `src/systems/enemyHooks/index.ts` - one import line and one `ENEMY_HOOKS` entry, each next to `dasherStreak`

### Interfaces
No new types. `export const flyerStreak: MakeEnemyHook` - the same `(ctx) => EnemyHook` shape as every other hook; uses only `scene`, `enemies` and `run` from `EnemyHookContext`.

### Steps
1. Create `src/systems/enemyHooks/flyerStreak.ts` with exactly this content:
```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import { bossId } from '../../core/waves';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The Flyer's streak: while a regular (non-boss) Flyer is in the sky - its whole crossing - a
 * flat streak in its own purple trails behind the token, stretched along its motion: one soft
 * flat shape at ground level under the token (DEPTH.preview). It re-derives from the enemy's
 * own state (`dirX`/`dirY`) every frame, so it always points where the Flyer came from; absent
 * before it spawns and the instant it dies or leaks. No sound, no text, no chip, no hitbox:
 * the flight line, hp, speed, gold and threat stay. The wave-50 boss keeps its own telegraph.
 */
export const flyerStreak: MakeEnemyHook = ({ scene, enemies, run }) => {
  /** One live streak per flying Flyer: its Graphics, at ground level. */
  const streaks = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy): void => {
    const g = streaks.get(e);
    if (!g) return;
    streaks.delete(e);
    g.destroy();
  };
  /** Base on the token (a diameter wide, as dasherStreak.ts); local +X points opposite the travel. */
  const draw = (e: Enemy, g: Phaser.GameObjects.Graphics): void => {
    const s = e.def.look.size * CELL; // the token's radius
    g.clear();
    g.setPosition(e.x, e.y);
    g.setRotation(Math.atan2(-e.dirY, -e.dirX));
    g.fillStyle(PALETTE[e.def.look.color], 0.25); // ~25% alpha, the Flyer's own purple
    g.fillTriangle(0, s, 0, -s, 3 * s, 0); // 1.5x the token's length (diameter is 2s), to a point at the back
  };
  return {
    update() {
      for (const e of [...streaks.keys()]) if (!e.active) drop(e); // a slot gone without a kill
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== 'flyer') continue;
        if (bossId(run.wave) === 'flyer') continue; // the wave-50 boss: its own telegraph, no streak
        const g = streaks.get(e);
        if (g === undefined) streaks.set(e, scene.add.graphics().setDepth(DEPTH.preview));
        draw(e, g);
      }
    },
    onKill({ enemy }) { drop(enemy); }, // gone the frame it dies, mid-flight included
    onLeak(enemy) { drop(enemy); },
  };
};
```
2. In `src/systems/enemyHooks/index.ts`: add `import { flyerStreak } from './flyerStreak';` directly next to the `dasherStreak` import (line 24), and one entry `flyerStreak,` directly after the `dasherStreak,` entry in `ENEMY_HOOKS` (line 59). Nothing else.

### Pitfalls
- Pooled enemies: a recycled slot must not keep a live Graphics - drop on `!e.active` in `update` AND in `onKill`/`onLeak` (all three, exactly as `dasherStreak`); use `g.destroy()`, never `despawn`.
- No fade-out: the Flyer is airborne its whole life, so the streak lives while `active` and is deleted outright; a fade would leave a ghost after leak/kill.
- Boss exclusion is `bossId(run.wave) === 'flyer'` (the idiom of `bossEscape`/`bossDeath`) - never a new enemy field; it is inert until the boss Flyer lands, and stays correct if the boss turns out to be a separate def (then only `def.id !== 'flyer'` matters).
- Geometry: `look.size * CELL` is the token radius, so `3 * s` is 1.5× the token's length and the base `±s` spans the token's width; do not hardcode the Flyer's size - read `e.def.look.size`.
- Depth is `DEPTH.preview` (5, under the token's `DEPTH.enemies` 20); color is `PALETTE[e.def.look.color]`, alpha 0.25; no glow/gradient/outline.
- `dirX`/`dirY` are refreshed every frame by `Enemy.advance()`, so the `Math.atan2(-e.dirY, -e.dirX)` rotation always trails the motion; no `dt` needed - do not declare an unused `dt` parameter (lint).

### Tests
none
