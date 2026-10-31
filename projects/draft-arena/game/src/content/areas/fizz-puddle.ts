import { noise, shade, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Fizz's puddle: where a bubble's splash lands, the ice stays 2.5 s and strikes everything inside
 * (monsters and players alike, players at half) every 0.5 s - five strikes. No slow (that is
 * Slush). Laid by the fizz upgrade at the splash's spot, as big as the splash.
 */
export const fizzPuddle: AreaDef = {
  id: 'fizz-puddle',
  radius: 70,
  life: 2.5,
  interval: 0.5,
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const a = Math.min(1, (1 - e.hp) * 5, e.hp * 2.5); // fade in fast, out over the last second
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      g.scale(1, 0.55); // the splash's rim, flattened to the ground
      g.fillStyle = shade(PALETTE.ice, 0.25);
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.setLineDash([5, 7]);
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      for (let i = 0; i < 3; i++) {
        const ang = noise(e.seed, i) * Math.PI * 2;
        const d = 0.3 + 0.45 * noise(e.seed, i + 3);
        g.beginPath();
        g.arc(Math.cos(ang) * d * e.radius, Math.sin(ang) * d * e.radius, 2.5, 0, Math.PI * 2);
        g.fillStyle = PALETTE.white;
        g.fill();
      }
      g.restore();
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) {
      ctx.effect('fizz-tick', { x: u.x, y: u.y });
      ctx.strike(a, u); // 3 damage (mine, before my damage stat), half vs players, no slow
    }
  },
};
