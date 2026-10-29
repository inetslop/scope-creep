import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A burning enemy wears Ember's own orange chip, the mark tick's chip look, for as long as the
// burn is live (time out, refresh, or a leap); the mark's pink keeps its spot and this one
// shifts right beside it, never up.

const W = 16; // chip width (the name chip body is ~2x this wide once its text is out)
const H = 9; // chip height (the name chip body is 20)
const R = 4; // corner radius, <= H/2 so it keeps the same rounded token look
const LIFT = 10; // chip centre sits this far above the token's top

/** One chip = one Graphics, drawn once at its local origin and moved with setPosition. */
function makeChip(fx: FxSystem): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(PALETTE.orangeDeep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R); // side face: peeks 2 below the body
  g.fillStyle(PALETTE.orange, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R); // body
  return g;
}

export const burnTick: MakeEnemyHook = ({ fx, enemies }) => {
  const chips = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = chips.get(e);
    if (!g) return;
    chips.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        if (!e.active || e.burn.left <= 0) {
          drop(e); // dead, leaked, unmarked or re-spawned: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          g = makeChip(fx);
          chips.set(e, g);
        }
        g.setPosition(e.x + (e.markPct > 0 ? W + 6 : 0), e.y - e.def.look.size * 64 - LIFT);
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
