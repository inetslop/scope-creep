import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The mark: +35% move speed for 15 s, nothing else, and a bonus for whoever knocks the player out.
 * It shows as a red target around the marked player: a ring with four ticks, pulsing once a
 * second. maxStacks counts how often the mark was applied (read by the price director,
 * directors/price.ts); it is one instance, never stacked.
 */
export const marked: StatusDef = {
  id: 'marked',
  name: 'Marked',
  color: PALETTE.red,
  speedMul: 1.35,
  maxStacks: 32,
  above: 18,
  draw(g, v) {
    const r = (v.radius + 10) * (1 + 0.06 * Math.sin(v.time * Math.PI * 2));
    const tick = (width: number, color: string): void => {
      g.lineWidth = width;
      g.strokeStyle = color;
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.moveTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
        g.lineTo(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7));
      }
      g.stroke();
    };
    g.lineCap = 'round';
    tick(6, v.ink);
    tick(3, v.color);
  },
};
