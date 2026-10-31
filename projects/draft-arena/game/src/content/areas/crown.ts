import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * The crown the top scorer wears: a yellow 3-point crown, 12 units above their head. The crown
 * director (directors/crown.ts) fires it every tick as a short-lived area that follows the wearer.
 */
export const crown: AreaDef = {
  id: 'crown',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the crown never disappears
  interval: 1, // > life: the empty pulse fires once at birth, never again
  follow: true, // stays centred on the wearer; ends when they are knocked out
  look: {
    shape: 'circle',
    color: PALETTE.yellow,
    draw(g) {
      // The bottom of the crown sits 12 units above the head (top of the body is y = -radius). Always faces up.
      const y0 = -(RULES.player.radius + 12);
      const y1 = y0 - 12;
      g.beginPath();
      g.moveTo(-13, y0);
      g.lineTo(-13, y1);
      g.lineTo(-6.5, y0 - 4);
      g.lineTo(0, y1);
      g.lineTo(6.5, y0 - 4);
      g.lineTo(13, y1);
      g.lineTo(13, y0);
      g.closePath();
      g.fillStyle = PALETTE.yellow;
      g.fill();
      g.lineJoin = 'round';
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    },
  },
  pulse() { /* a marker: no damage */ },
};
