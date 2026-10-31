import { type AreaDef, type Unit } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * The Snare mark: a small blue drop riding a sapped critter's upper back. It shows while the critter
 * is sapped (1 s, refreshed in the puddle) and dries up when the sap fades. It rides like a Cling
 * splat and deals no damage of its own.
 */
export const sappedDrop: AreaDef = {
  id: 'sapped-drop',
  radius: 6,
  life: 2,
  interval: 0.25,
  follow: false,
  look: {
    shape: 'circle', color: PALETTE.blue,
    draw(g, e) {
      const r = e.radius;
      const tr = e.slots[0] > 0 ? e.slots[0] : 12; // the mark's radius, set by the pulse
      const t = Math.PI * 0.75; // the tail: up-back, over the body edge
      const tail = () => {
        g.beginPath();
        g.moveTo(Math.cos(t + 0.5) * r * 0.9, Math.sin(t + 0.5) * r * 0.9);
        g.lineTo(Math.cos(t) * r * 1.9, Math.sin(t) * r * 1.9);
        g.lineTo(Math.cos(t - 0.5) * r * 0.9, Math.sin(t - 0.5) * r * 0.9);
        g.closePath();
      };
      g.save();
      g.rotate(e.angle); // the mark's facing; its back is -x, -y is up
      g.translate(-tr * 0.55, -tr * 0.55); // sit on the upper back
      tail();
      g.lineJoin = 'round';
      g.lineWidth = 4; // the part's outline, doubled (the body inks at 2)
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = PALETTE.blue;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      tail();
      g.fillStyle = PALETTE.blue; // no stroke: covers the inner half of the doubled ink
      g.fill();
      g.beginPath();
      g.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); // candy shine
      g.fillStyle = PALETTE.white;
      g.fill();
      g.restore();
    },
  },
  pulse(ctx, a) {
    // The mark is the unit wearing 'sapped'. Fastest unit (Swift-3 player) runs ~33 in 0.25 s,
    // so 120 reach always finds it; nearest wins when two marks crowd.
    let t: Unit | undefined;
    let best = 120 * 120;
    for (const u of ctx.unitsNear(a.x, a.y, 120)) {
      if (ctx.statusOf(u, 'sapped') <= 0) continue;
      const d = (u.x - a.x) ** 2 + (u.y - a.y) ** 2;
      if (d < best) { best = d; t = u; }
    }
    if (!t) { a.life = a.age; return; } // the sap faded: dry up
    if (a.mem.born === undefined) a.mem.born = t.mem.sapBorn ?? -1; // first pulse
    if (t.mem.sapBorn !== a.mem.born) { a.life = a.age; return; } // re-sapped: the newer drop rides it
    a.x = t.x; a.y = t.y; a.angle = t.angle; // ride it wherever it runs
    a.slots[0] = Math.round(t.radius);
    a.life = a.age + 0.3; // one more pulse (0.25 s); the sap fade ends it after
  },
};
