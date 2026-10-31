import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Sting: a crowded corpse bursts - a teal ring with an ink rim blooms out to `value`, teal confetti with it. */
export const stingBurst: EffectDef = {
  id: 'sting-burst',
  duration: 0.3,
  draw(g, fx) {
    g.globalAlpha = 1 - fx.t;
    const r = fx.value * fx.t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.teal;
    g.stroke();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 7));
      g.fillStyle = PALETTE.teal;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
  },
};
