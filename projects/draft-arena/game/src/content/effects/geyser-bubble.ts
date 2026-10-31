import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const WARN = 2;
const RING = 8;

/** Geyser: 2 s of bubbles rising in a ring at the spot, then a pulsing lime ring holds the spot 8 s, one pulse per gem. */
export const geyserBubble: EffectDef = {
  id: 'geyser-bubble',
  duration: WARN + RING,
  draw(g, fx) {
    if (fx.age < WARN) {
      const rise = fx.age / WARN;
      g.globalAlpha = 1 - rise * 0.8;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
        const y = fx.ay + Math.sin(a) * 70 - rise * (30 + 25 * noise(fx.seed, i + 10));
        g.fillStyle = PALETTE.white;
        g.strokeStyle = PALETTE.ink;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(fx.ax + Math.cos(a) * 70, y, 4 + 3 * noise(fx.seed, i + 20), 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      return;
    }
    const ringT = (fx.age - WARN) / RING;
    g.globalAlpha = ringT < 0.875 ? 1 : (1 - ringT) / 0.125;
    const r = 74 + 8 * (1 - ((fx.age - WARN) % 1));
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = PALETTE.lime;
    g.stroke();
  },
};
