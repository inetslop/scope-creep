import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A marked enemy wears the Mark's own pink tick: a small rounded chip (a third the name chip's
// size, no text) riding just above the token. It appears on first mark and is gone the moment the
// mark comes off -- dead, leaked, or re-spawned -- so a dead or unmarked enemy shows nothing.

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

export const markTick: MakeEnemyHook = ({ fx, enemies }) => {
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
        if (!e.active || e.markPct <= 0) {
          drop(e); // dead, leaked, unmarked or re-spawned: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          g = makeChip(fx);
          chips.set(e, g);
        }
        g.setPosition(e.x, e.y - e.def.look.size * 64 - LIFT); // just above the token
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
