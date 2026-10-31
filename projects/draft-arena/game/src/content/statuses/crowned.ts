import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The top scorer's crown (directors/crown.ts keeps it on them), just over the head or the hat, always upright. */
export const crowned: StatusDef = {
  id: 'crowned',
  name: 'Crowned',
  color: PALETTE.yellow,
  above: 20,
  draw(g, v) {
    const y0 = v.top - 5;
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
    g.strokeStyle = v.ink;
    g.stroke();
  },
};
