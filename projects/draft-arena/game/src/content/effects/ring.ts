import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Level up: a yellow ring with an ink rim spreading from the player, and stars flying off it. */
export const ring: EffectDef = {
  id: 'ring',
  duration: 0.7,
  draw(g, fx) {
    const r = 26 + fx.t * 80;
    g.globalAlpha = 1 - fx.t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.yellow;
    g.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + fx.t * 2;
      g.save();
      g.translate(fx.ax + Math.cos(a) * (r + 14), fx.ay + Math.sin(a) * (r + 14));
      g.beginPath();
      traceShape(g, 'star', 7, fx.t * 5);
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
  },
};
