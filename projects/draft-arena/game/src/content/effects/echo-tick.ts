import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Where the echo bubble turns: a small white 4-unit pop, fizz-tick style, no glow. */
export const echoTick: EffectDef = {
  id: 'echo-tick',
  duration: 0.15,
  draw(g, fx) {
    const r = 4 * fx.t;
    if (r <= 0) return;
    g.globalAlpha = 1 - fx.t;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.lineWidth = 2;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
    if (r > 1) {
      g.beginPath();
      g.arc(fx.ax, fx.ay, r - 1, 0, Math.PI * 2);
      g.lineWidth = 1;
      g.strokeStyle = PALETTE.white;
      g.stroke();
    }
  },
};
