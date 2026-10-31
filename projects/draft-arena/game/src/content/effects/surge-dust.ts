import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { rumble } from '../../audio/sfx.ts';

/** Swarm surge: at the middle of the edge a line walks in from, a coral dust ring with an ink rim blooms out to radius 45, 6 coral confetti off it. */
export const surgeDust: EffectDef = {
  id: 'surge-dust',
  duration: 0.6,
  draw(g, fx) {
    rumble(fx.seed, fx.age);
    g.globalAlpha = 1 - fx.t;
    const r = 45 * fx.t;
    g.lineWidth = 6;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.coral;
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 6));
      g.fillStyle = PALETTE.coral;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 3.5 * (1 - fx.t) + 1, 0, Math.PI * 2);
      g.fill();
    }
  },
};
