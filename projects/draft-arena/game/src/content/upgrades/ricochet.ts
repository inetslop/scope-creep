import type { Unit, UpgradeDef } from '../../../engine/api.ts';
import { driftOf } from '../projectiles/swoop-bolt.ts';
import { swoopDamage } from './swoop.ts';
import { PALETTE } from '../palette.ts';

/** Gunner capstone: bolts bounce on to a second enemy. */
export const ricochet: UpgradeDef = {
  id: 'ricochet',
  name: 'Ricochet',
  description: 'Bolts that hit bounce on to another enemy nearby.',
  maxLevel: 1,
  look: { shape: 'star', color: PALETTE.yellow, scale: 1.1 },
  onHit(ctx, me, _level, hit) {
    const shot = hit.projectile;
    // p1 = 1 marks a bounced bolt: it doesn't bounce again.
    if (!shot || (shot.def.id !== 'bolt' && shot.def.id !== 'drift-bolt' && shot.def.id !== 'swoop-bolt') || shot.launch.p1 === 1) return;
    let next: Unit | undefined;
    let best = 260 * 260;
    for (const u of ctx.enemiesNear(me, hit.x, hit.y, 260)) {
      const d = (u.x - hit.x) ** 2 + (u.y - hit.y) ** 2;
      if (u !== hit.target && d < best) {
        best = d;
        next = u;
      }
    }
    if (!next) return;
    const swooping = shot.def.id === 'swoop-bolt';
    const drifting = shot.def.id === 'drift-bolt';
    const rank = driftOf(me);
    ctx.fire(me, shot.def.id, {
      x: hit.x, y: hit.y,
      angle: Math.atan2(next.y - hit.y, next.x - hit.x),
      speed: 620,
      damage: swooping ? swoopDamage(me) : 9,
      p1: 1,
      life: swooping ? (rank >= 2 ? 1.2 : rank === 1 ? 0.8 : undefined) : drifting ? (rank >= 2 ? 1.2 : 0.8) : undefined,
    });
  },
};
