import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A player within 350 wakes it; it sleeps again only after 10 s with every player beyond 500. */
const WAKE = 350;
const SLEEP = 500;
const WINDUP = 0.5;
const AWAY = 10;

export const squashEase = (t: number) => { const c = Math.min(1, Math.max(0, t / 0.15)); return c * c * (3 - 2 * c); };
export const sleeperCushion = (state: number, t: number): [number, number] => {
  const awake = state === 0 ? 1 - squashEase(t) : squashEase(t);
  return [1.15 - 0.1 * awake, 0.85 + 0.1 * awake]; // flat asleep, up awake, eased
};

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const ANGRY: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };

const look: Look = { shape: 'square', color: PALETTE.magenta, face: CALM };
/** A magenta squashed cushion; flatter with closed eyes while asleep, snarling with open eyes once woken. */
look.draw = (g, e) => {
  const state = e.slots[0] ?? 0; // 0 sleeping, 1 waking, 2 awake
  const [sx, sy] = sleeperCushion(state, (e.slots[1] ?? 0) / 100);
  g.save();
  g.scale(sx, sy);
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: it keeps its shape
  g.restore();
  g.save(); // face rides with the cushion's height, drawn unsquashed
  g.translate(0, (sy - 1) * e.radius * 0.15);
  drawFace(g, state === 0 ? CALM : ANGRY, e.radius, e.angle, PALETTE.ink);
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
    if (state !== (mem.sl ?? 0)) mem.ste = 0; // new state: the clock starts at 0
    else mem.ste = (mem.ste ?? 0) + dt;
    mem.sl = state;
    m.slots[0] = state;
    m.slots[1] = Math.min(32767, Math.round((mem.ste ?? 0) * 100));
    m.damage = state === 2 ? m.def.damage : 0; // touch damage while awake only
  },
};
