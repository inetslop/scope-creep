import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Holds a 220-420 band; every 2.2 s it winds up 0.6 s and lobs a plop that splashes where it lands. */
const NEAR = 220;
const FAR = 420;
const BACK_SPEED = 40;
const WINDUP = 0.6;
const WAIT = 1.6; // WINDUP + WAIT = the 2.2 s cycle
const PLOP_SPEED = 240;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const WIND: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'circle', color: PALETTE.peach, face: CALM };
/**
 * A big squashed melon, the biggest body in the menagerie; a purple blob inflates in its mouth
 * during the windup. The final color is #ffc078 (PALETTE.peach), a light orange no other monster uses.
 */
look.draw = (g, e) => {
  const wind = (e.slots[0] ?? 0) === 1;
  g.save();
  g.scale(1, 0.85); // squashed: wide and low
  drawCritter(g, look, e, { ink: PALETTE.ink });
  g.restore();
  drawFace(g, wind ? WIND : CALM, e.radius, e.angle, PALETTE.ink); // the face keeps its shape: after the squashed body
  if (wind) {
    const q = (e.slots[1] ?? 0) / 100;
    if (q > 0) {
      g.beginPath();
      g.arc(0, e.radius * 0.42, 10 * q, 0, Math.PI * 2); // the mouth sits at (0, r * 0.42)
      g.fillStyle = PALETTE.purple;
      g.fill();
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 2;
      g.stroke();
      g.beginPath();
      g.ellipse(-3 * q, e.radius * 0.42 - 3 * q, 3 * q, 1.8 * q, -0.6, 0, Math.PI * 2);
      g.fillStyle = PALETTE.white;
      g.fill();
    }
  }
};

/** The menagerie's next threat: a slow melon that lobs a splashing blob from its band. */
export const toss: MonsterDef = {
  id: 'toss',
  name: 'Toss',
  description: 'Holds its band and lobs a blob that splashes where it lands.',
  hp: 60,
  speed: 55,
  radius: 26,
  damage: 16,
  xp: 5,
  weight: 3,
  fromLevel: 6,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.tp ?? 0; // 0 moving/holding, 1 winding up
    if (phase === 1) {
      // Windup: hold ground, face the locked aim; the blob inflates, then the plop goes.
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.ta ?? 0;
      const left = (mem.tw ?? WINDUP) - dt;
      mem.tw = left;
      if (left <= 0) {
        const life = (mem.td ?? FAR) / PLOP_SPEED;
        ctx.fire(m, 'plop', { angle: mem.ta ?? 0, speed: PLOP_SPEED, damage: 0, life, p1: Math.round(life * 100) });
        phase = 0;
        mem.tc = 0;
        m.slots[0] = 0;
        m.slots[1] = 0;
        mem.tp = phase;
        return;
      }
      m.slots[0] = 1;
      m.slots[1] = Math.round((1 - left / WINDUP) * 100);
      mem.tp = phase;
      return;
    }
    m.slots[0] = 0;
    m.slots[1] = 0;
    mem.tc = (mem.tc ?? 0) + dt; // seconds since the last plop
    const t = m.target;
    if (!t) {
      m.vx = 0;
      m.vy = 0;
      return;
    }
    const d = Math.hypot(t.x - m.x, t.y - m.y);
    const a = Math.atan2(t.y - m.y, t.x - m.x);
    if (d < NEAR) {
      m.vx = -Math.cos(a) * BACK_SPEED; // too close: back off at 40, and it never lobs from here
      m.vy = -Math.sin(a) * BACK_SPEED;
      m.angle = a;
    } else if (d > FAR) {
      chase(m); // too far: close at its own 55 u/s, fanned in like any crowding monster
    } else {
      m.vx = 0; // in the band: hold position (fanned at its own approach angle)
      m.vy = 0;
      m.angle = a;
      if (mem.tc >= WAIT) {
        phase = 1; // start the windup, aim locked for the whole 0.6 s
        mem.tw = WINDUP;
        mem.ta = a;
        mem.td = d;
        m.slots[0] = 1;
      }
    }
    mem.tp = phase;
  },
};
