import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober capstone: a Goo kill pops into 4 mini-Goo, each hunting a different nearby enemy. */
export const scatter: UpgradeDef = {
  id: 'scatter',
  name: 'Scatter',
  description:
    'When a Goo kills, it pops into 4 mini-Goo that home to the 4 nearest enemies: 4 damage, 200 u/s, 1 s. Mini-Goo do not pop again.',
  maxLevel: 1,
  look: { shape: 'pentagon', color: PALETTE.blue },
  onKill(ctx, me, _level, victim) {
    if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return;
    const sorted = ctx.enemiesNear(me, victim.x, victim.y, 260)
      .map((u) => ({ u, d: (u.x - victim.x) ** 2 + (u.y - victim.y) ** 2 }))
      .sort((a, b) => a.d - b.d);
    for (let i = 0; i < Math.min(4, sorted.length); i++) {
      const t = sorted[i]!.u;
      ctx.fire(me, 'goolet', { x: victim.x, y: victim.y, angle: v.angleTo(victim, t), speed: 200, damage: 4, p1: Math.round(t.x), p2: Math.round(t.y) });
    }
  },
};
