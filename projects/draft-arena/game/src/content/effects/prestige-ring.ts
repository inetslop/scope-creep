import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Prestige: the field's biggest ring, 0.2 s after the level-up ring, with 24 stars off it. */
export const prestigeRing: EffectDef = {
  id: 'prestige-ring',
  duration: 1,
  draw(g, fx) {
    if (fx.t < 0.2) return;
    const t = (fx.t - 0.2) / 0.8;
    const r = 26 + t * 194;
    g.globalAlpha = 1 - t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.yellow;
    g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + t * 2;
      g.save();
      g.translate(fx.ax + Math.cos(a) * (r + 14), fx.ay + Math.sin(a) * (r + 14));
      g.beginPath();
      traceShape(g, 'star', 7, t * 5);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
  },
};
