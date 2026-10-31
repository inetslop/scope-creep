import { chase, drawFace, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Within 180 it crouches 0.6 s, then leaps at 320 u/s for at most 0.5 s to where the player is going, then sits 0.9 s. */
const REACH = 180;
const CROUCH = 0.6;
const LEAP_SPEED = 320;
const LEAP = 0.5;
const SIT = 0.9;
const PREDICT = 0.4;
const REST: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };
const FANGS: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'circle', color: shade(PALETTE.red, -0.45), face: REST };
/** A deep red heart (no heart in the Shape enum: the body is traced by hand; the face is drawn inside the transform so it squashes with the body). */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0; // 0 resting, 1 crouching, 2 leaping, 3 sitting
  const r = e.radius;
  g.fillStyle = 'rgba(40, 30, 70, 0.13)';
  g.beginPath();
  g.ellipse(0, r * 0.82, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  g.save();
  if (phase === 0) g.translate(0, Math.sin(e.time * 2.2 + e.seed) * r * 0.06); // a slow bob at rest
  if (phase === 1) g.scale(1.4, 0.5); // crouch: squashed to half its height
  else if (phase === 2) { const s = Math.min(0.5, e.speed / 640); g.scale(1 - s, 1 + s); } // stretched in flight
  else if (phase === 3) g.scale(1.15, 0.85); // spent after the leap
  g.beginPath();
  g.moveTo(0, r * 0.75); // the point of the heart, at the bottom
  g.bezierCurveTo(-r * 1.05, r * 0.1, -r * 0.95, -r * 0.75, -r * 0.45, -r * 0.75);
  g.bezierCurveTo(-r * 0.12, -r * 0.75, 0, -r * 0.5, 0, -r * 0.4);
  g.bezierCurveTo(0, -r * 0.5, r * 0.12, -r * 0.75, r * 0.45, -r * 0.75);
  g.bezierCurveTo(r * 0.95, -r * 0.75, r * 1.05, r * 0.1, 0, r * 0.75);
  g.closePath();
  g.fillStyle = e.flash ? '#ffffff' : look.color;
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  drawFace(g, phase === 1 || phase === 2 ? FANGS : REST, r, e.angle, PALETTE.ink);
  g.restore();
};

/** The only leaper: shuffles in, telegraphs a crouch, then leaps at the player's predicted spot and sits. */
export const boing: MonsterDef = {
  id: 'boing',
  name: 'Boing',
  description: "Crouches, then leaps to where you're going.",
  hp: 24,
  speed: 40,
  radius: 14,
  damage: 14,
  xp: 3,
  weight: 5,
  fromLevel: 5,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.ph ?? 0; // 0 shuffling, 1 crouching, 2 leaping, 3 sitting
    let left = phase === 0 ? 0 : (mem.tm ?? 0) - dt;
    const t = m.target;
    if (phase === 1) { // Crouch: still, facing the locked point - the warning to move.
      m.vx = 0; m.vy = 0; m.angle = mem.ang ?? 0;
      if (left <= 0) { phase = 2; left = LEAP; }
    } else if (phase === 2) { // Leap: straight to the predicted point, no re-aiming.
      const ang = mem.ang ?? 0;
      m.vx = Math.cos(ang) * LEAP_SPEED; m.vy = Math.sin(ang) * LEAP_SPEED; m.angle = ang;
      if (left <= 0 || Math.hypot((mem.bx ?? m.x) - m.x, (mem.by ?? m.y) - m.y) <= LEAP_SPEED * dt) {
        phase = 3; left = SIT; m.vx = 0; m.vy = 0;
      }
    } else if (phase === 3) { // Sitting: spent, can't crouch yet.
      m.vx = 0; m.vy = 0;
      if (left <= 0) phase = 0;
    } else if (t && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) { // In reach: lock the leap on position + heading * 0.4 s.
      const px = t.x + t.vx * PREDICT;
      const py = t.y + t.vy * PREDICT;
      phase = 1; left = CROUCH;
      mem.ang = Math.atan2(py - m.y, px - m.x);
      mem.bx = px; mem.by = py;
      m.vx = 0; m.vy = 0; m.angle = mem.ang;
    } else {
      chase(m); // shuffle in at walk speed, fanned out like a Dot
    }
    mem.ph = phase;
    mem.tm = left;
    m.slots[0] = phase;
  },
};
