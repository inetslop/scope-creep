import type { AreaDef, Unit } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Cling splat: a blue drop on its mark's back that bites every 0.5 s until the mark fades. */
export const splat: AreaDef = {
  id: 'splat', radius: 10, life: 2, interval: 0.5, follow: false,
  look: {
    shape: 'circle', color: PALETTE.blue,
    draw(g, e) {
      const r = e.radius;
      const tr = e.slots[0] > 0 ? e.slots[0] : 12; // the mark's radius, set by the pulse
      const q = 1 - (e.time % 0.5) / 0.5; // 1 just after a bite, 0 just before the next
      const fade = Math.min(1, e.hp * 5); // dries out as it wears off
      if (fade <= 0) return;
      g.save();
      g.globalAlpha = fade;
      g.rotate(e.angle); // the mark's facing; its back is -x
      g.translate(-(tr + r * 0.6), 0); // sit on the back, just past the body edge
      g.scale(1 + 0.3 * q, 1 - 0.25 * q); // squish once per tick
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = PALETTE.blue;
      g.fill();
      g.lineWidth = 2;
      g.lineJoin = 'round';
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); // candy shine
      g.fillStyle = PALETTE.white;
      g.fill();
      g.restore();
    },
  },
  pulse(ctx, a) {
    // The mark is the only unit wearing 'cling'. Fastest unit (Swift-3 player) runs 135 in 0.5 s,
    // so 170 reach always finds it; nearest wins when two marks crowd.
    let t: Unit | undefined;
    let best = 170 * 170;
    for (const u of ctx.unitsNear(a.x, a.y, 170)) {
      if (ctx.statusOf(u, 'cling') <= 0) continue;
      const d = (u.x - a.x) ** 2 + (u.y - a.y) ** 2;
      if (d < best) { best = d; t = u; }
    }
    if (!t) { a.life = a.age; return; }
    const born = t.mem.clingBorn ?? -1;
    if (a.mem.born === undefined) a.mem.born = born; // first pulse
    if (born !== a.mem.born || Math.round(ctx.time * 100) >= (t.mem.clingUntil ?? -1)) {
      a.life = a.age; // the mark faded, or was re-cast by a newer splat: dry up
      return;
    }
    a.x = t.x; a.y = t.y; a.angle = t.angle; // ride it wherever it runs
    a.slots[0] = Math.round(t.radius);
    a.life = a.age + 0.55; // one more pulse (0.5 s); the gate above ends it after
    ctx.strike(a, t); // the bite: credited to the Goober, half vs players, and a hit (Reap applies)
  },
};
