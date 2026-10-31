import { drawCritter, traceShape, type Look, type PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The jackpot: the normal gem's look three times over, with a small star sparkle at one corner. */
const look: Look = { shape: 'diamond', color: PALETTE.yellow };
look.draw = (g, e) => {
  drawCritter(g, look, e, { ink: PALETTE.ink, glint: true });
  g.save();
  g.translate(0, -e.radius);
  g.beginPath();
  traceShape(g, 'star', 5);
  g.fillStyle = PALETTE.white;
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.restore();
};

export const jackpot: PickupDef = {
  id: 'jackpot',
  radius: 21,
  life: 20,
  look,
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
  },
};
