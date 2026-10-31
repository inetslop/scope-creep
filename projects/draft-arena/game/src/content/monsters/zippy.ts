import { chase, drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The rhythm: reach at 260, a 0.8 s wind-up, a 420 u/s dash for 0.4 s, then 1.5 s tired. */
const REACH = 260;
const WINDUP = 0.8;
const DASH_SPEED = 420;
const DASH = 0.4;
const TIRED = 1.5;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const ANGRY: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'triangle', color: PALETTE.pink, face: CALM };
/** A deceptively cute crawler; flat and snarling with a pink lane line while it winds up. */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0; // 0 crawling, 1 winding up, 2 dashing, 3 tired
  g.save();
  if (phase === 1 || phase === 3) g.scale(1.3, 0.6); // squashed flat
  drawCritter(g, look, e, { ink: PALETTE.ink, face: phase === 1 || phase === 2 ? ANGRY : CALM });
  g.restore();
  if (phase === 1) {
    // The lane: a short sticker line ahead, along the dash direction (its facing).
    const x0 = Math.cos(e.angle) * e.radius * 1.4;
    const y0 = Math.sin(e.angle) * e.radius * 1.4;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(Math.cos(e.angle) * (e.radius * 1.4 + 30), Math.sin(e.angle) * (e.radius * 1.4 + 30));
    g.lineCap = 'round';
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = PALETTE.pink;
    g.lineWidth = 5;
    g.stroke();
  }
};

/** The first monster that moves on its own: crawls, telegraphs a lane, dashes straight along it. */
export const zippy: MonsterDef = {
  id: 'zippy',
  name: 'Zippy',
  description: 'Winds up, then dashes straight along its lane.',
  hp: 18,
  speed: 60,
  radius: 12,
  damage: 22,
  xp: 2,
  weight: 6,
  fromLevel: 4,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.zp ?? 0; // 0 crawling, 1 winding up, 2 dashing, 3 tired
    let left = phase === 0 ? 0 : (mem.zt ?? 0) - dt;
    const lane = mem.za ?? 0;
    const t = m.target;
    if (phase === 1) {
      // Wind-up: stopped, flat, facing the lane locked when the wind-up began.
      m.vx = 0;
      m.vy = 0;
      m.angle = lane;
      if (left <= 0) { phase = 2; left = DASH; }
    } else if (phase === 2) {
      // Dash: straight along the lane, no tracking - a sideways step slips it.
      m.vx = Math.cos(lane) * DASH_SPEED;
      m.vy = Math.sin(lane) * DASH_SPEED;
      m.angle = lane;
      if (left <= 0) { phase = 3; left = TIRED; m.vx = 0; m.vy = 0; }
    } else if (phase === 3) {
      // Tired: crawl back into the hunt, no dashing yet.
      chase(m);
      if (left <= 0) phase = 0;
    } else if (t && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) {
      // In range: lock the lane toward the player and start the wind-up.
      phase = 1;
      left = WINDUP;
      mem.za = Math.atan2(t.y - m.y, t.x - m.x);
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.za;
    } else {
      // Crawl: head for the nearest player, fanned out like a Dot.
      chase(m);
    }
    mem.zp = phase;
    mem.zt = left;
    m.slots[0] = phase;
  },
};
