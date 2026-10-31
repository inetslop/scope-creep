import { along, drawCritter, type ProjectileDef, type Unit } from '../../../engine/api.ts';
import { driftRank } from '../upgrades/drift.ts';
import { PALETTE } from '../palette.ts';

const LEG_T = 0.22; // the creep: how long the bolt crouches before it dives
const DIVE = 820; // the dive, units/s

/** Swoop's bolt: a slow nose-down creep (the telegraph), then the dive. */
export const swoopBolt: ProjectileDef = {
  id: 'swoop-bolt',
  radius: 7,
  life: 1.0, // Every firing site overrides: 0.8 (Drift 1) or 1.2 (Drift 2); 0.6 from Cover.
  look: {
    shape: 'triangle',
    color: PALETTE.ice,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      g.save();
      g.rotate(e.angle);
      g.strokeStyle = PALETTE.teal;
      g.lineWidth = 3;
      g.lineCap = 'round';
      // The dip: a streak off the nose, drooping below the line of flight — the crouch before the dive.
      g.beginPath();
      g.moveTo(9, 0);
      g.quadraticCurveTo(11, 5, 5, 8);
      g.stroke();
      g.restore();
    },
  },
  path(s, t) {
    if (t <= LEG_T) return along(s, t);
    const leg = LEG_T * s.speed;
    const d = leg + DIVE * (t - LEG_T);
    return { x: s.x + Math.cos(s.angle) * d, y: s.y + Math.sin(s.angle) * d };
  },
  onEnd(ctx, p) {
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, 24); // the dive's ring, small
  },
};

/** A unit's Drift rank, 0 for anything that is not a player: what stretches a swoop-bolt's life. */
export function driftOf(u: Unit): number {
  return u.type === 'player' ? driftRank(u) : 0;
}
