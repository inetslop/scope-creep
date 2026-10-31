import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The fizz-puddle's strike: a small white pop where it lands. */
export const fizzTick: EffectDef = {
  id: 'fizz-tick',
  duration: 0.25,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = 4 + 8 * fx.t; // a 4-unit pop that grows as it fades
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
  },
};
