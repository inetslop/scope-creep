import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Popper's death: a soft orange ring blooming out to 40 with a few confetti, as small as a monster pop. */
export const puffBurst: EffectDef = {
  id: 'puff-burst',
  duration: 0.5,
  draw(g, fx) {
    const fade = 1 - fx.t;
    g.globalAlpha = 0.3 * fade; // soft orange fill
    g.beginPath();
    g.arc(fx.ax, fx.ay, 40 * Math.max(0.12, fx.t), 0, Math.PI * 2); // blooms out to 40
    g.fillStyle = PALETTE.orange;
    g.fill();
    g.globalAlpha = 0.9 * fade; // ink rim
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 3;
    g.stroke();
    for (let i = 0; i < 7; i++) { // a few orange confetti, sized like a monster pop
      const a = (i / 7) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = 8 + fx.t * 42 * (0.8 + 0.4 * noise(fx.seed, i + 7));
      g.globalAlpha = fade;
      g.fillStyle = PALETTE.orange;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
    }
  },
};
