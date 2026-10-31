import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const COLORS = [PALETTE.yellow, PALETTE.pink, PALETTE.blue, PALETTE.teal, PALETTE.white];

/** A player knocked out: a puff ring and a big burst of confetti. */
export const burst: EffectDef = {
  id: 'burst',
  duration: 0.8,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(fx.ax, fx.ay, fx.value + fx.t * 50, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + noise(fx.seed, i);
      const d = fx.value + fx.t * (70 + 60 * noise(fx.seed, i + 20));
      g.fillStyle = COLORS[i % COLORS.length]!;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 5 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  },
};
