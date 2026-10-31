import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 90;
const EVERY = 120;
const WARN = 2;
const GEMS = 8;
const XP = 4;
const MARGIN = 300;

/** At 90 s and every 120 s: a marked spot bubbles for 2 s, then a ring holds it for 8 s, a gem worth 4 xp in the middle every second. */
export const gemGeyser: DirectorDef = {
  id: 'gem-geyser',
  name: 'Gem geyser',
  description: 'A spot bubbles, then drops a gem every second for 8 s. Hold it.',
  tick(ctx, mem) {
    if ((mem.phase ?? 0) === 1) {
      const age = ctx.time - mem.start;
      if (age >= WARN) {
        while (mem.drops < GEMS && age >= WARN + mem.drops) {
          mem.drops += 1;
          ctx.dropPickup('event-gem', mem.x, mem.y, XP);
        }
      }
      if (age >= WARN + GEMS) mem.phase = 0;
      return;
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    mem.phase = 1;
    mem.start = ctx.time;
    mem.drops = 0;
    mem.x = ctx.rng.range(MARGIN, ctx.rules.world.width - MARGIN);
    mem.y = ctx.rng.range(MARGIN, ctx.rules.world.height - MARGIN);
    ctx.effect('geyser-bubble', { x: mem.x, y: mem.y });
  },
};
