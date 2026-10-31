import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober fork: a Goo that hits doesn't pop — it splats on its mark and keeps biting while it runs. */
export const cling: UpgradeDef = {
  id: 'cling',
  name: 'Cling',
  description:
    'When your Goo hits, it splats on its target and clings for 2 s, dealing 5 damage every 0.5 s. Per rank: +5 damage per tick.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.blue },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile || hit.projectile.def.id !== 'goo') return; // only the Goo's drop splats (goolet, Bolt, Maw, Lob: nothing)
    const t = hit.target;
    if (t.hp <= 0) return; // kills resolve after onHit: a finishing Goo leaves no splat on the corpse
    const fresh = ctx.statusOf(t, 'cling') <= 0;
    ctx.addStatus(t, 'cling', 2);
    t.mem.clingUntil = Math.round(ctx.time * 100) + 200; // mark's deadline, refreshed by every hit
    if (fresh) {
      t.mem.clingBorn = Math.round(ctx.time * 100); // epoch of this splat
      ctx.area(me, 'splat', { x: t.x, y: t.y, damage: 5 * level });
    }
  },
};
