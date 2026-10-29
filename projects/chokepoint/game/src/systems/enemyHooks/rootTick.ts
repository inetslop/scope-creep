import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A rooted enemy (rootLeft > 0) wears the Anchor's pink chip, the mark tick's look, for as
// long as the root is live (an Anchor pulse or a hit from any tower with Anchor added); the
// mark's pink, the burn's and the slow's keep their spots and this one rides last in the row,
// right of them all, and is gone the moment the root wears off.

const W = 16; // chip width (the name chip body is ~2x this wide once its text is out)
const H = 9; // chip height (the name chip body is 20)
const R = 4; // corner radius, <= H/2 so it keeps the same rounded token look
const LIFT = 10; // chip centre sits this far above the token's top

/** One chip = one Graphics, drawn once at its local origin and moved with setPosition. */
function makeChip(fx: FxSystem): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(PALETTE.pinkDeep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R); // side face: peeks 2 below the body
  g.fillStyle(PALETTE.pink, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R); // body
  return g;
}

export const rootTick: MakeEnemyHook = ({ fx, enemies }) => {
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
        if (!e.active || e.rootLeft <= 0) {
          drop(e); // dead, leaked, not rooted or re-spawned: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          g = makeChip(fx);
          chips.set(e, g);
        }
        g.setPosition(e.x + (W + 6) * ((e.markPct > 0 ? 1 : 0) + (e.burn.left > 0 ? 1 : 0) + (e.slowPct > 0 ? 1 : 0)), e.y - e.def.look.size * 64 - LIFT); // last of the row: right of the mark, burn and slow chips
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
