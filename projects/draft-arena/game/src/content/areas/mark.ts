import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * The mark's target ring: a red ring with an ink rim, 12 units above the marked player's head
 * (the crown's height, but red). The mark director (directors/mark.ts) fires it every tick as a
 * short-lived area that follows the wearer; it pulses once per second.
 */
export const mark: AreaDef = {
  id: 'mark',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the ring never disappears
  interval: 1, // > life: the empty pulse fires once at birth, never again
  follow: true, // stays centred on the marked player; ends when they are knocked out
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const y0 = -(RULES.player.radius + 12); // 12 units above the head (top of the body is y = -radius)
      const r = 26 * (1 + 0.08 * Math.sin(e.time * Math.PI * 2)); // one pulse per second
      g.beginPath();
      g.arc(0, y0, r, 0, Math.PI * 2);
      g.lineWidth = 6;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.arc(0, y0, r, 0, Math.PI * 2);
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.red;
      g.stroke();
    },
  },
  pulse() { /* a marker: no damage */ },
};
