import { chase, drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A sleepy crawler: every 1.5 s of movement it sinks and leaves a sticky patch on the floor. */
const SINK = 0.3;
const LAY = 1.5;

const SLEEPY: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const SETTLING: Face = { mood: 'calm', eyes: 2, mouth: 'o' };

const look: Look = { shape: 'hexagon', color: PALETTE.orange, face: SLEEPY };
/** While it sinks (slots[0], 100 -> 0) it squashes flat and its mouth closes to o. */
look.draw = (g, e) => {
  const sink = e.slots[0] ?? 0;
  g.save();
  if (sink > 0) g.scale(1.3, 0.6); // squashed flat
  drawCritter(g, look, e, { ink: PALETTE.ink, face: sink > 0 ? SETTLING : SLEEPY });
  g.restore();
};

export const snail: MonsterDef = {
  id: 'snail',
  name: 'Snail',
  description: 'Leaves sticky patches behind; the muck slows whatever crosses it.',
  hp: 60,
  speed: 30,
  radius: 18,
  damage: 10,
  xp: 5,
  weight: 3,
  fromLevel: 5,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    chase(m);
    const since = (mem.snT ?? 0) + dt;
    let sink = (mem.snS ?? 0) - dt;
    if (since >= LAY) {
      // Sink and lay a sticky patch where it is: mem keeps the timer, the client sees it in slots.
      mem.snT = since - LAY;
      sink = SINK;
      ctx.area(m, 'sticky', { x: m.x, y: m.y });
    } else {
      mem.snT = since;
    }
    mem.snS = Math.max(0, sink);
    m.slots[0] = Math.round(Math.max(0, Math.min(1, sink / SINK)) * 100);
  },
};
