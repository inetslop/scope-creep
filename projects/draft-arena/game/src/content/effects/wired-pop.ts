import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small yellow tick puff on a critter when a speed burst lands. */
export const wiredPop: EffectDef = {
  id: 'wired-pop',
  duration: 0.3,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = 7 + 5 * fx.t;
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.arc(fx.ax - r * 0.35, fx.ay - r * 0.35, 2, 0, Math.PI * 2);
    g.fill();
  },
};
