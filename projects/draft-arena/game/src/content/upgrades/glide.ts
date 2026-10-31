import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive mod, works with every weapon: while the crowd is on you, your hits keep you fast. */
export const glide: UpgradeDef = {
  id: 'glide',
  name: 'Glide',
  description:
    'While 3+ enemies are within 80 of you, you move 20% faster, refreshed on each of your hits, 1.5 s. Rank 2: 30% for 2 s.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.yellow },
  onHit(ctx, me, level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble in flight) are not hits
    let crowd = 0;
    for (const u of ctx.unitsNear(me.x, me.y, 80))
      if (u.alive && u !== me) crowd++;
    if (crowd < 3) return;
    const id = level === 2 ? 'wired-2' : 'wired-1';
    if (ctx.statusOf(me, id) <= 0) ctx.effect('wired-pop', { x: me.x, y: me.y });
    ctx.addStatus(me, id, level === 2 ? 2 : 1.5);
  },
};
