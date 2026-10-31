import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 45;
const EVERY = 150;
const LIFE = 20;
const XP = 25;
const GEM_R = 21;

/** At 45 s and 150 s after the last one landed: one big gem worth 25 xp lands in the middle of the field. It lasts 20 s, then pops where it is. At most one on the field at a time. */
export const jackpot: DirectorDef = {
  id: 'jackpot',
  name: 'Jackpot',
  description: 'A big gem worth 25 xp lands in the middle of the field and lasts 20 s.',
  tick(ctx, mem) {
    if (mem.phase === 1) {
      if (ctx.time - mem.start >= LIFE) {
        mem.phase = 0;
        for (const p of ctx.players()) {
          if ((p.x - mem.x) ** 2 + (p.y - mem.y) ** 2 < (p.stats.pickup + GEM_R) ** 2) return;
        }
        ctx.effect('pop', { x: mem.x, y: mem.y }, undefined, GEM_R);
      }
      return;
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    mem.start = ctx.time;
    mem.phase = 1;
    const c = ctx.rules.world.width / 2;
    mem.x = ctx.rng.range(c - 500, c + 500);
    mem.y = ctx.rng.range(c - 500, c + 500);
    ctx.dropPickup('jackpot', mem.x, mem.y, XP);
    ctx.effect('ring', { x: mem.x, y: mem.y });
    ctx.effect('pop', { x: mem.x, y: mem.y }, undefined, GEM_R);
  },
};
