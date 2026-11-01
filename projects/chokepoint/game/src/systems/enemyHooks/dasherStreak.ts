import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/** Streak length (board units): one cell along the road. */
const LEN = CELL;
/** Seconds the streak takes to fade out once the dash ends (simulation dt). */
const FADE_SEC = 0.1;
/** Resting alpha: the Dasher's own purple, one flat shape. */
const ALPHA = 0.4;

/**
 * The Dasher's surge trail: while a Dasher is in its 0.3 s dash leg, a flat streak in its own
 * purple trails one cell behind the token, widest at the token and tapering to a point at the
 * tail — so the burst reads as speed the instant it happens. A per-frame draw on the enemy's
 * own state (`dashLeg`), ground level under the token (DEPTH.preview); it fades out over
 * 100 ms the moment the dash ends. No sound, no input, no gameplay change: the Dasher's
 * numbers, white wind-up and token look stay as they are.
 */
export const dasherStreak: MakeEnemyHook = ({ scene, enemies }) => {
  /** One live streak per dashing Dasher: its Graphics and its fade (1 while dashing). */
  const streaks = new Map<Enemy, { g: Phaser.GameObjects.Graphics; a: number }>();
  const drop = (e: Enemy): void => {
    const s = streaks.get(e);
    if (!s) return;
    streaks.delete(e);
    s.g.destroy();
  };
  /** Base on the token (a diameter wide); local +X rotated to point opposite the travel (as enemyMarks.ts does). */
  const draw = (e: Enemy, s: { g: Phaser.GameObjects.Graphics; a: number }): void => {
    s.g.setPosition(e.x, e.y);
    s.g.setRotation(Math.atan2(-e.dirY, -e.dirX));
    s.g.clear();
    s.g.fillStyle(PALETTE[e.def.look.color], ALPHA * s.a);
    s.g.fillTriangle(0, e.def.look.size * CELL, 0, -e.def.look.size * CELL, LEN, 0);
  };
  return {
    update(dt) {
      for (const e of [...streaks.keys()]) if (!e.active) drop(e); // a slot gone without a kill
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== 'dasher') continue;
        const s = streaks.get(e);
        if (e.dashLeg === 'dash') {
          if (s === undefined) streaks.set(e, { g: scene.add.graphics().setDepth(DEPTH.preview), a: 1 });
          draw(e, streaks.get(e)!);
        } else if (s) {
          s.a -= dt / FADE_SEC; // the crawl follows; the base rides on it while it fades
          if (s.a <= 0) drop(e); else draw(e, s);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); }, // gone the frame it dies, mid-dash included
    onLeak(enemy) { drop(enemy); },
  };
};
