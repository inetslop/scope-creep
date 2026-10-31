import type { Launch, ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const BUBBLE_SPEED = 500;
export const BUBBLE_FLIGHT = 0.8;
/** How high the arc rises (world units) at the middle of the flight. */
const ARC = 80;

/** The aim packed into the launch: p1 = target x, p2 = target y * 8 + (level - 1). */
function aim(s: Launch): { x: number; y: number } {
  return { x: s.p1, y: Math.floor(s.p2 / 8) };
}

/**
 * The Lob's bubble: rises in an arc and lands where the enemy was when it left the hand. It never
 * hits in flight (damage 0, pierce 99): it just arcs to the ground and lays its splash on landing.
 */
export const bubble: ProjectileDef = {
  id: 'bubble',
  radius: 8,
  life: BUBBLE_FLIGHT,
  pierce: 99,
  look: { shape: 'circle', color: PALETTE.ice },
  path(s, t) {
    const a = aim(s);
    const d = Math.hypot(a.x - s.x, a.y - s.y);
    // s.speed already has the owner's projectileSpeed stat, so Quick (a faster stat) lands it sooner.
    const f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT));
    // sin(PI*f) is 0 at f=0 and f=1, so it rises and lands exactly on its aim.
    return { x: s.x + Math.cos(s.angle) * d * f, y: s.y + Math.sin(s.angle) * d * f - ARC * Math.sin(Math.PI * f) };
  },
  onEnd(ctx, p) {
    const me = p.owner;
    if (me.type !== 'player') return;
    const level = (p.launch.p2 % 8) + 1;
    ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area));
  },
};
