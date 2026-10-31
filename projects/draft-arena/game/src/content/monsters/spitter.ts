import { drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The distance band it holds around the nearest player. */
const NEAR = 160;
const FAR = 280;
const WINDUP = 0.5;
const COOLDOWN = 1.6;
const GLOB_SPEED = 150;
const GLOB_DAMAGE = 6;

const IDLE: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const WIND: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };

const look: Look = { shape: 'diamond', color: PALETTE.orange, face: IDLE };
/** Calm diamond with an "o" spit hole; scowling with an orange glob at its mouth while winding up. */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0;
  drawCritter(g, look, e, { ink: PALETTE.ink, face: phase === 1 ? WIND : IDLE });
  if (phase === 1) {
    // The glob forming in the mouth (drawCritter draws the mouth at (0, r * 0.42)).
    g.fillStyle = PALETTE.orange;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, e.radius * 0.42, e.radius * 0.16, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
};

/** Keeps its distance and spits a glob that deals 6. */
export const spitter: MonsterDef = {
  id: 'spitter',
  name: 'Spitter',
  description: 'Keeps its distance and spits a glob that deals 6.',
  hp: 20,
  speed: 75,
  radius: 13,
  damage: 8,
  xp: 2,
  weight: 5,
  fromLevel: 5,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    let phase = mem.sp ?? 0; // 0 moving, 1 winding up
    if (phase === 1) {
      // Wind-up: holds its ground, facing the aim locked when it started; committed like the Zippy's.
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.sa ?? 0;
      mem.sr = (mem.sr ?? WINDUP) - dt;
      if (mem.sr <= 0) {
        ctx.fire(m, 'glob', { angle: mem.sa ?? 0, speed: GLOB_SPEED, damage: GLOB_DAMAGE });
        mem.sg = (mem.sg ?? 0) + 1;
        mem.st = 0;
        phase = 0;
      }
    } else {
      mem.st = (mem.st ?? 0) + dt; // seconds since the last glob
      if (t) {
        const d = Math.hypot(t.x - m.x, t.y - m.y);
        const a = Math.atan2(t.y - m.y, t.x - m.x);
        if (d < NEAR) {
          m.vx = -Math.cos(a) * m.speed; // too close: straight away
          m.vy = -Math.sin(a) * m.speed;
          m.angle = a;
        } else if (d > FAR) {
          m.vx = Math.cos(a) * m.speed; // too far: straight in
          m.vy = Math.sin(a) * m.speed;
          m.angle = a;
        } else {
          m.vx = 0; // in the band: hold ground and, when ready, spit
          m.vy = 0;
          m.angle = a;
          if ((mem.sg ?? 0) < 2 && mem.st >= COOLDOWN) {
            phase = 1;
            mem.sr = WINDUP;
            mem.sa = a;
          }
        }
      } else {
        m.vx = 0;
        m.vy = 0;
      }
    }
    mem.sp = phase;
    m.slots[0] = phase;
  },
};
