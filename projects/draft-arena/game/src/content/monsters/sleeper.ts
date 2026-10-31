import { chase, drawCritter, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A player within 350 wakes it; it sleeps again only after 10 s with every player beyond 500. */
const WAKE = 350;
const SLEEP = 500;
const WINDUP = 0.5;
const AWAY = 10;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const ANGRY: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };

const look: Look = { shape: 'square', color: shade(PALETTE.pink, -0.35), face: CALM };
/** A deep pink squashed cushion; flatter with closed eyes while asleep, snarling with open eyes once woken. */
look.draw = (g, e) => {
  const state = e.slots[0] ?? 0; // 0 sleeping, 1 waking, 2 awake
  g.save();
  g.scale(state === 0 ? 1.15 : 1.05, state === 0 ? 0.85 : 0.95); // the cushion, flatter while it sleeps
  drawCritter(g, look, e, { ink: PALETTE.ink, face: state === 0 ? CALM : ANGRY });
  if (state === 0) {
    // Closed eyes: paint over the open ones, then a small arc under each (drawFace puts two eyes at ±0.34r, -0.12r, radius 0.26r).
    const eyeR = e.radius * 0.26;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = Math.max(1.5, e.radius * 0.1);
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ex = s * e.radius * 0.34;
      const ey = -e.radius * 0.12;
      g.fillStyle = e.flash ? PALETTE.white : look.color;
      g.beginPath();
      g.arc(ex, ey, eyeR, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(ex, ey, eyeR * 0.6, 0.25 * Math.PI, 0.75 * Math.PI);
      g.stroke();
    }
  }
  g.restore();
};

/** Sleeps where it fell; what wakes is faster than a Dot and stops being safe to walk through. */
export const sleeper: MonsterDef = {
  id: 'sleeper',
  name: 'Sleeper',
  description: 'Sleeps until you get close, then chases faster than a Dot.',
  hp: 20,
  speed: 100,
  radius: 15,
  damage: 10,
  xp: 3,
  weight: 5,
  fromLevel: 4,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    const near = t ? Math.hypot(t.x - m.x, t.y - m.y) : Infinity;
    let state = mem.sl ?? 0; // 0 sleeping, 1 waking, 2 awake
    if (state === 0) {
      m.vx = 0;
      m.vy = 0;
      if (near <= WAKE) {
        state = 1;
        mem.wt = WINDUP;
      }
    } else if (state === 1) {
      m.vx = 0; // eyes open, still: the 0.5 s warning
      m.vy = 0;
      mem.wt = (mem.wt ?? WINDUP) - dt;
      if (mem.wt <= 0) state = 2;
    } else {
      chase(m);
      mem.at = near > SLEEP ? (mem.at ?? 0) + dt : 0; // seconds with every player beyond 500
      if (mem.at >= AWAY) {
        state = 0;
        mem.at = 0;
      }
    }
    mem.sl = state;
    m.slots[0] = state;
    m.damage = state === 2 ? m.def.damage : 0; // touch damage while awake only
  },
};
