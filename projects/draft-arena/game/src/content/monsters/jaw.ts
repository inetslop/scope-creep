import { chase, drawCritter, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The rhythm: a 0.6 s wind-up at a player within 90, one bite, then 1.5 s before the next. */
const REACH = 90;
const WINDUP = 0.6;
const COOLDOWN = 1.5;

function drawJawFace(g: CanvasRenderingContext2D, r: number, open: boolean, ink: string): void {
  const mx = r * 0.24; // the mouth is in front of the body, along the facing
  for (const s of [-1, 1]) {
    const ex = mx + s * r * 0.1;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(ex, -r * 0.42, r * 0.09, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = ink;
    g.beginPath();
    g.arc(ex + r * 0.03, -r * 0.42, r * 0.045, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = ink;
    g.lineWidth = Math.max(1.5, r * 0.07);
    g.lineCap = 'round';
    g.beginPath(); // angry brow: down toward the middle
    g.moveTo(ex + s * r * 0.1, -r * 0.5);
    g.lineTo(ex - s * r * 0.08, -r * 0.56);
    g.stroke();
  }
  if (open) {
    // the giant mouth: a dark opening, 4 white tooth bumps
    g.fillStyle = ink;
    g.beginPath();
    g.ellipse(mx, 0, r * 0.24, r * 0.28, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    for (const tx of [-1, 1]) {
      for (const ty of [-1, 1]) {
        g.beginPath();
        g.arc(mx + tx * r * 0.11, ty * r * 0.2, r * 0.06, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else {
    // closed: a white teeth grin
    g.fillStyle = '#ffffff';
    g.strokeStyle = ink;
    g.lineWidth = Math.max(1.5, r * 0.07);
    g.beginPath();
    g.rect(mx - r * 0.22, -r * 0.15, r * 0.44, r * 0.3);
    g.fill();
    g.stroke();
    g.beginPath();
    for (let i = 1; i < 4; i++) {
      const x = mx - r * 0.22 + r * 0.11 * i;
      g.moveTo(x, -r * 0.15);
      g.lineTo(x, r * 0.15);
    }
    g.stroke();
  }
}

const look: Look = { shape: 'circle', color: PALETTE.crimson, face: false };
/** The face is the mouth: a closed teeth grin at idle, wide open through the wind-up. */
look.draw = (g, e) => {
  const k = (e.slots[1] ?? 0) / 100; // the mouth opening, eased 0..1
  g.save();
  g.rotate(e.angle);
  g.scale(1.08 + 0.12 * k, 0.92 - 0.12 * k); // squashed along the facing
  g.rotate(-e.angle);
  drawCritter(g, look, e, { ink: PALETTE.ink });
  g.restore();
  g.save();
  g.rotate(e.angle);
  drawJawFace(g, e.radius, k > 0.5, PALETTE.ink);
  g.restore();
};

/** A fat deep-red blob whose face is the mouth: stops, opens it, and bites everything in front. */
export const jaw: MonsterDef = {
  id: 'jaw',
  name: 'Jaw',
  description: 'Stops, opens its giant mouth, then bites everything in front.',
  hp: 50,
  speed: 55,
  radius: 26,
  damage: 6,
  xp: 5,
  weight: 3,
  fromLevel: 4,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.jp ?? 0; // 0 shuffling, 1 winding up
    let left = phase === 0 ? 0 : (mem.jt ?? 0) - dt;
    let cd = (mem.jc ?? 0) - dt;
    const t = m.target;
    if (phase === 1) {
      // Wind-up: stopped, facing locked from the start of the wind-up.
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.ja ?? 0;
      if (left <= 0) {
        // The bite: one strike in a 100 deg cone in the locked facing.
        phase = 0;
        cd = COOLDOWN;
        ctx.area(m, 'jaw-bite', { damage: 10 });
      }
    } else if (t && cd <= 0 && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) {
      // In range: lock the facing at the player and open the mouth.
      phase = 1;
      left = WINDUP;
      mem.ja = Math.atan2(t.y - m.y, t.x - m.x);
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.ja;
    } else {
      // Shuffle: head for the nearest player, grin closed.
      chase(m);
    }
    const want = phase === 1 ? 1 : 0;
    mem.jk = Math.max(0, Math.min(1, (mem.jk ?? 0) + (want - (mem.jk ?? 0)) * Math.min(1, dt / 0.06)));
    mem.jp = phase;
    mem.jt = left;
    mem.jc = cd;
    m.slots[0] = phase;
    m.slots[1] = Math.round((mem.jk ?? 0) * 100);
  },
};
