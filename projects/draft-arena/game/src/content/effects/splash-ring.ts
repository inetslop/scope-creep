import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * A bubble landing, or a Fuse popping: an ice ring with an ink rim blooming out to its value
 * (the splash radius, or the pop's 50).
 */
export const splashRing: EffectDef = {
  id: 'splash-ring',
  duration: 0.45,
  draw(g, fx) {
    const r = fx.value * fx.t;
    if (r <= 0) return;
    g.globalAlpha = 1 - fx.t;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.ink;
    g.stroke();
    if (r > 4) {
      g.beginPath();
      g.arc(fx.ax, fx.ay, r - 2, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ice;
      g.stroke();
    }
  },
};
