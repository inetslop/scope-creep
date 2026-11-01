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
        if (streaks.get(e) === undefined) streaks.set(e, scene.add.graphics().setDepth(DEPTH.preview));
        draw(e, streaks.get(e)!);
      }
    },
    onKill({ enemy }) { drop(enemy); }, // gone the frame it dies, mid-flight included
    onLeak(enemy) { drop(enemy); },
  };
};
