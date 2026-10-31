import { drawCritter, moveForward, turnToward, type Launch, type Point, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { BUBBLE_FLIGHT, BUBBLE_SPEED } from './bubble.ts';
import { bopRank } from '../upgrades/bop.ts';
import { echoRank } from '../upgrades/echo.ts';

export const ECHO_TURN = 0.2; // seconds the bubble turns in place (not Quick-scaled)
export const ECHO_RETURN = 1.0; // seconds of the return leg
export const ECHO_RETURN_SPEED = 100; // u/s at Quick 0

/** The return splash, as a fraction of the splash's normal radius: 50%, 75%, 100% of it. */
export function echoReturnRadius(rank: number): number {
  return 0.5 + 0.25 * (rank - 1);
}

const ARC = 80; // bubble.ts keeps its own copy

/** The aim packed into the launch: p1 = target x, p2 = target y * 8 + (level - 1). */
function aim(s: Launch): Point {
  return { x: s.p1, y: Math.floor(s.p2 / 8) };
}

/** The out leg: the Lob bubble's arc, word for word (bubble.ts's path). tests/echo.test.ts pins the match. */
export function echoOutLeg(s: Launch, t: number): Point {
  const a = aim(s);
  const d = Math.hypot(a.x - s.x, a.y - s.y);
  // s.speed already carries the owner's projectileSpeed stat, so Quick (a faster stat) lands it sooner.
  const f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT));
  return { x: s.x + Math.cos(s.angle) * d * f, y: s.y + Math.sin(s.angle) * d * f - ARC * Math.sin(Math.PI * f) };
}

/** The Echo bubble: the Lob bubble's exact arc out, a splash where it lands, a 0.2 s turn, then home back to the thrower. */
export const echoBubble: ProjectileDef = {
  id: 'echo-bubble',
  radius: 8,
  life: 2, // fire() overrides: the out leg + the turn + the return leg
  pierce: 99, // a plain echo bubble strikes through critters harmlessly; fire() drops it to 1 with Bop
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      // The Lobber's thin teal band: this bubble comes back. It pulses on the return leg (slot 0 = 2).
      const r = e.radius + 2.5 + (e.slots[0] === 2 ? 1 + Math.sin(e.time * 12) : 0);
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.teal;
      g.stroke();
    },
  },
  step(ctx, p, dt) {
    const me = p.owner;
    // A knocked-out thrower: the bubble pops in a small puff, no splash, no return.
    if (me.type !== 'player' || !me.alive) {
      if (!p.mem.popped) {
        p.mem.popped = 1;
        ctx.effect('slow-pop', { x: p.x, y: p.y });
      }
      p.life = p.age;
      return;
    }
    // The launch is fixed at fire, so both legs scale off it, never off the (mutable) stats.
    const mul = p.launch.speed / BUBBLE_SPEED; // Quick: the out leg lands sooner and the return leg flies faster
    const outTime = BUBBLE_FLIGHT / mul;
    if (p.age < outTime) {
      const at = echoOutLeg(p.launch, p.age);
      p.x = at.x;
      p.y = at.y;
      p.slots[0] = 0;
      return;
    }
    if (!p.mem.splashed) {
      p.mem.splashed = 1;
      // Land exactly where the arc lands, as today's bubble does (its path clamps to the aim).
      const land = echoOutLeg(p.launch, outTime);
      p.x = land.x;
      p.y = land.y;
      const level = (p.launch.p2 % 8) + 1;
      ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) });
      ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area));
      ctx.effect('echo-tick', { x: p.x, y: p.y });
    }
    if (p.age < outTime + ECHO_TURN) {
      p.slots[0] = 1;
      turnToward(p, { x: me.x, y: me.y }, 20 * dt); // in place: no moveForward
      return;
    }
    // The return leg: homes to the thrower at 100 u/s (15% faster per Quick rank).
    p.slots[0] = 2;
    p.speed = ECHO_RETURN_SPEED * mul;
    turnToward(p, { x: me.x, y: me.y }, 10 * dt);
    moveForward(p, dt);
  },
  onHit(ctx, p, target) {
    if (p.damage <= 0) return; // a plain echo bubble carries no contact damage
    p.pierce = 0; // a pop always kills the bubble, even with Lance pierce: it never returns
    const me = p.owner;
    if (me.type !== 'player') return;
    // Bop's pop, exactly as bop-bubble plays it - here at the critter it touched.
    const rank = Math.min(3, Math.max(1, bopRank(me)));
    const radius = 30 + 5 * rank;
    ctx.area(me, 'bop-burst', { x: target.x, y: target.y, damage: 14 + 5 * (rank - 1), life: 0.2 * rank });
    ctx.effect('splash-ring', { x: target.x, y: target.y }, undefined, radius);
    ctx.effect('bop-confetti', { x: target.x, y: target.y }, undefined, radius);
  },
  onEnd(ctx, p) {
    const me = p.owner;
    if (me.type !== 'player' || !me.alive) return; // a knocked-out thrower's bubble already popped in a puff
    const level = (p.launch.p2 % 8) + 1;
    // The return splash: the normal splash's damage, a smaller radius (50/75/100% of it by Echo rank).
    const frac = echoReturnRadius(echoRank(me));
    ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1), radius: 70 * frac });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * frac * me.stats.area));
  },
};
