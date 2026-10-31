import { drawCritter, type Launch, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { BUBBLE_FLIGHT, BUBBLE_SPEED } from './bubble.ts';
import { bopRank } from '../upgrades/bop.ts';

const ARC = 80; // bubble.ts keeps its own copy

/** The aim packed into the launch: p1 = target x, p2 = target y * 8 + (level - 1). */
function aim(s: Launch): { x: number; y: number } {
  return { x: s.p1, y: Math.floor(s.p2 / 8) };
}

/** Bop's bubble: same arc flight; the first critter it touches pops it into a burst instead of splashing. */
export const bopBubble: ProjectileDef = {
  id: 'bop-bubble',
  radius: 8,
  life: BUBBLE_FLIGHT,
  // No pierce here: the engine defaults it to 1 (Lance adds more at fire time), and onHit zeroes
  // it, so the bubble always dies on the first critter it touches.
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      g.beginPath();
      g.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.white; // the lollipop band
      g.stroke();
    },
  },
  path(s, t) {
    // Word for word from bubble.ts: it never hits in flight, it just arcs to where the aim was.
    const a = aim(s);
    const d = Math.hypot(a.x - s.x, a.y - s.y);
    const f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT));
    return { x: s.x + Math.cos(s.angle) * d * f, y: s.y + Math.sin(s.angle) * d * f - ARC * Math.sin(Math.PI * f) };
  },
  onHit(ctx, p) {
    p.pierce = 0; // a pop always kills the bubble, even with Lance pierce
    const me = p.owner;
    if (me.type !== 'player') return;
    const rank = Math.min(3, Math.max(1, bopRank(me)));
    const radius = 30 + 5 * rank;
    ctx.area(me, 'bop-burst', { x: p.x, y: p.y, damage: 14 + 5 * (rank - 1), life: 0.2 * rank });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, radius);
    ctx.effect('bop-confetti', { x: p.x, y: p.y }, undefined, radius);
  },
  onEnd(ctx, p) {
    // Touched nothing: splash exactly like the plain bubble (Wide/Fuse/Fizz apply to it).
    const me = p.owner;
    if (me.type !== 'player') return;
    const level = (p.launch.p2 % 8) + 1;
    ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area));
  },
};
