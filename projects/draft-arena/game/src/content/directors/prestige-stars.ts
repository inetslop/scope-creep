import type { DirectorDef } from '../../../engine/api.ts';

/**
 * Prestige stars (areas/prestige-stars.ts): one gold star per prestige this life, up to 3, fanned
 * off the top-right of the critter. The area's 10 s life is re-fired 1 s before it expires, so the
 * stars keep the player for the whole life yet cannot linger on the field after they leave (a
 * follow area only ends when its owner dies, and a leaver is never marked dead). The area's
 * 1-second pulse keeps its count current, so a 2nd or 3rd prestige adds a star without waiting
 * for a re-fire. On a knockout the area dies with its owner, and prestiges this life reset.
 */
export const prestigeStars: DirectorDef = {
  id: 'prestige-stars',
  name: 'Prestige stars',
  description: 'One gold star per prestige this life (up to 3), fanned off the top-right of the critter.',
  tick(ctx, mem) {
    for (const p of ctx.players()) {
      const key = 'stars' + p.id;
      const last = mem[key];
      // Fire on the first prestige; re-fire 1 s before the area's 10 s life ends (areas/prestige-stars.ts).
      if (p.prestige > 0 && (last === undefined || ctx.time - last >= 9)) {
        mem[key] = ctx.time;
        ctx.area(p, 'prestige-stars');
      }
    }
  },
};
