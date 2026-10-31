import type { DirectorDef, Player } from '../../../engine/api.ts';

/**
 * Every 100 s (first at 50 s), twelve 1 xp gems lay themselves in a line across the field:
 * the first to grab any one takes all twelve. The gems are dropped with value 0, so the
 * engine's collect gives nothing; this pays the grabber instead: first grab 12 xp, the
 * rest of the line worth nothing after, and the not-yet-laid gems appear at the grabber,
 * where the engine collects them for them.
 */
const FIRST = 50;
const EVERY = 100;
const N = 12;
const GAP = 75;
const STEP = 0.5;
const MARGIN = 200;
const GEM_R = 7;

export const gemRush: DirectorDef = {
  id: 'gem-rush',
  name: 'Gem rush',
  description: 'Every 100 s, twelve gems lay themselves in a line across the field: the first to grab one takes all twelve.',
  tick(ctx, mem) {
    if (ctx.time >= (mem.next ?? FIRST)) {
      mem.next = ctx.time + EVERY;
      mem.start = ctx.time;
      mem.spawned = 0;
      mem.claimed = 0;
      const a = ctx.rng.range(0, Math.PI * 2);
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const half = ((N - 1) / 2) * GAP;
      const w = ctx.rules.world;
      const cx = ctx.rng.range(MARGIN + half * Math.abs(dx), w.width - MARGIN - half * Math.abs(dx));
      const cy = ctx.rng.range(MARGIN + half * Math.abs(dy), w.height - MARGIN - half * Math.abs(dy));
      for (let i = 0; i < N; i++) {
        mem['x' + i] = cx + (i - (N - 1) / 2) * GAP * dx;
        mem['y' + i] = cy + (i - (N - 1) / 2) * GAP * dy;
        mem['c' + i] = 0;
      }
    }
    if (mem.start === undefined) return;
    const due = Math.min(N, Math.floor((ctx.time - mem.start) / STEP) + 1);
    for (let i = mem.spawned; i < due; i++) ctx.dropPickup('gem', mem['x' + i], mem['y' + i], 0);
    mem.spawned = due;
    if (mem.claimed) return;
    for (let i = 0; i < N; i++) {
      if (mem['c' + i]) continue;
      const x = mem['x' + i];
      const y = mem['y' + i];
      let p: Player | undefined;
      let d2 = Infinity;
      for (const u of ctx.unitsNear(x, y, GEM_R)) {
        if (u.type !== 'player') continue;
        const q2 = (u.x - x) ** 2 + (u.y - y) ** 2;
        if (q2 < d2) { p = u; d2 = q2; }
      }
      if (!p) continue;
      mem['c' + i] = 1;
      mem.claimed = 1;
      ctx.giveXp(p, 12);
      for (let j = mem.spawned; j < N; j++) ctx.dropPickup('gem', p.x, p.y, 0);
      mem.spawned = N;
      break;
    }
  },
};
