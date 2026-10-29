import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { deepOf } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// The Splitter's crack is its whole deal, and there are no hp bars: at half hp or less the
// token's own crack line is redrawn twice as thick in the token's own deep color, so
// "about to split" reads before it happens. Above half hp nothing is drawn. The split
// itself is unchanged: still on death from any source (split.ts). The line's numbers copy
// the crack painted in art/entities.ts (same path, same width formula, doubled).

export const crackTick: MakeEnemyHook = ({ fx, enemies }) => {
  const lines = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = lines.get(e);
    if (!g) return;
    lines.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        // Only the enemy whose token paints a crack, at half hp or less (a dead one too,
        // so a same-frame kill can't leave a line on a corpse).
        if (!e.active || e.def.splitsInto === undefined || e.hp <= 0 || e.hp * 2 > e.maxHp) {
          drop(e);
          continue;
        }
        let g = lines.get(e);
        if (!g) {
          g = makeLine(fx, e);
          lines.set(e, g);
        }
        // The face's center: the token's face sits depth/2 above the enemy's point (art/entities.ts).
        const r = e.def.look.size * CELL;
        g.setPosition(e.x, e.y - Math.max(2, r * 0.18) / 2);
      }
    },
    onKill({ enemy }) {
      drop(enemy); // gone the frame it dies, even on the wave's last frame
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};

/** One line = one Graphics: the crack drawn once at the face-center origin, moved with setPosition. */
function makeLine(fx: FxSystem, e: Enemy): Phaser.GameObjects.Graphics {
  const r = e.def.look.size * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.lineStyle(2 * Math.max(1, r * 0.1), deepOf(e.def.look.color), 1); // twice the painted crack, in its own deep
  g.beginPath();
  g.moveTo(-r * 0.55, -r * 0.1);
  g.lineTo(r * 0.05, r * 0.12);
  g.lineTo(r * 0.55, -r * 0.02);
  g.strokePath();
  return g;
}
