import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE, deepOf } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

// A rampler (one damaging hit taken, so speed > base) wears its own tick: the mark tick's
// chip (16x9 rounded, no text) in its own color, just above the token -- and above the mark
// tick's chip when it is marked too. It appears on the first damaging hit (with the hit
// flash) and is gone the moment it dies. A rampler at base speed (never hit) shows nothing.
const W = 16; // same chip as the mark tick (markTick.ts)
const H = 9;
const R = 4;
const LIFT = 10; // chip centre sits this far above the token's top, same as the mark tick

function makeChip(fx: FxSystem, color: number, deep: number): Phaser.GameObjects.Graphics {
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.fillStyle(deep, 1);
  g.fillRoundedRect(-W / 2, -H / 2 + 2, W, H, R); // side face: peeks 2 below the body
  g.fillStyle(color, 1);
  g.fillRoundedRect(-W / 2, -H / 2, W, H, R); // body
  return g;
}

export const rampTick: MakeEnemyHook = ({ fx, enemies }) => {
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
        if (!e.active || e.def.speedRamp === undefined || e.speed <= e.def.speed * CELL) {
          drop(e); // dead, leaked, not a rampler, or at base speed: no tick
          continue;
        }
        let g = chips.get(e);
        if (!g) {
          const c = e.def.look.color;
          g = makeChip(fx, PALETTE[c], deepOf(c)); // the enemy's own color: orange for the Sprinter
          chips.set(e, g);
        }
        const extra = e.markPct > 0 ? H + 4 : 0; // a marked rampler already wears the pink mark tick
        g.setPosition(e.x, e.y - e.def.look.size * 64 - LIFT - extra);
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
