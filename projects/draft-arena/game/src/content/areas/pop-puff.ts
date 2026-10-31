import { type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Where a Popper died: a still orange puff that strikes everything standing in it (players and monsters) once. */
export const popPuff: AreaDef = {
  id: 'pop-puff',
  radius: 40,
  life: 0.5,
  interval: 0.6, // > life: exactly one pulse
  look: {
    shape: 'circle',
    color: PALETTE.orange,
    draw(g, e) {
      const fade = e.hp; // 1 at birth -> 0 at death
      g.globalAlpha = 0.4 * fade;
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fillStyle = PALETTE.orange;
      g.fill();
      g.globalAlpha = 0.9 * fade;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 3;
      g.stroke();
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) { // players and monsters alike
      if (u.alive && u.id !== a.owner.id) ctx.strike(a, u);
    }
  },
};
