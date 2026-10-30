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
