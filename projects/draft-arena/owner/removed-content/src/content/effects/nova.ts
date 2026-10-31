import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Nova's burst: a teal ring with an ink rim racing out to its reach (value). */
export const novaBurst: EffectDef = {
  id: 'nova',
  duration: 0.4,
  draw(g, fx) {
    const r = fx.value * (0.3 + 0.7 * fx.t);
    g.globalAlpha = (1 - fx.t) * 0.25;
    g.fillStyle = PALETTE.teal;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1 - fx.t;
    g.lineWidth = 8;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = PALETTE.teal;
    g.stroke();
  },
};
