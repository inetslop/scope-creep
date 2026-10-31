import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small purple tick puff on a critter when a horn dart splits there. */
export const lashTick: EffectDef = {
  id: 'lash-tick',
  duration: 0.3,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = 7 + 5 * fx.t;
    g.fillStyle = PALETTE.purple;
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
