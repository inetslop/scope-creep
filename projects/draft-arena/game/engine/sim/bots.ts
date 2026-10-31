/**
 * Server-side bots: they fill a match that has few humans, and they drive the headless tests. A bot
 * is an ordinary player whose input comes from here: keep away from monsters and players, drift
 * toward gems, wander, stay off the edges, and spend talent points after a short pause (mostly
 * in the tree it has spent most in, so a bot commits to a playstyle).
 *
 * Every force fades to zero at the edge of its reach, and the bot eases its direction toward the
 * sum instead of snapping to it: a monster stepping in and out of range, or two pulls that nearly
 * cancel, must not flip the bot back and forth every tick (that reads as a spasm on screen).
 */
import type { Rng } from '../shared/rng.ts';
import { spentIn } from '../talents.ts';
import type { BotBrain, SimPlayer } from './entities.ts';
import type { Match } from './match.ts';

export function makeBrain(rng: Rng): BotBrain {
  const wanderAngle = rng.next() * Math.PI * 2;
  return { wanderAngle, wanderIn: 0, pickIn: rng.range(0.5, 2), moveX: Math.cos(wanderAngle), moveY: Math.sin(wanderAngle), favorite: '' };
}

const DANGER = 260;
const GREED = 420;
const EDGE = 300;
/** How fast a bot turns toward what it wants (per second): about a quarter of the way each tick. */
const TURN_RATE = 6;

export function thinkBot(m: Match, p: SimPlayer, dt: number): void {
  const brain = p.brain!;
  let fx = 0;
  let fy = 0;

  // Away from what is close: strong up close, fading to nothing at DANGER.
  let threat = 0;
  m.units.each(p.x, p.y, DANGER, (u) => {
    if (u === p || !u.alive) return;
    const dx = p.x - u.x;
    const dy = p.y - u.y;
    const d = Math.hypot(dx, dy);
    if (d >= DANGER || d < 0.5) return;
    const push = (u.cat === 'monster' ? 4 : 1.5) * (1 - d / DANGER) ** 1.5;
    fx += (dx / d) * push;
    fy += (dy / d) * push;
    threat += push;
  });

  // Toward the nearest gem, fading in over the last 100 units of reach.
  let gem: { x: number; y: number } | undefined;
  let gemD = GREED;
  m.visible.each(p.x, p.y, GREED, (e) => {
    if (e.cat !== 'pickup' || e.dead) return;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < gemD) {
      gem = e;
      gemD = d;
    }
  });
  if (gem && gemD > 0.5) {
    const pull = 0.8 * Math.min(1, (GREED - gemD) / 100);
    fx += ((gem.x - p.x) / gemD) * pull;
    fy += ((gem.y - p.y) / gemD) * pull;
  }

  // Wander (less when in danger), and keep off the edges, harder the closer.
  brain.wanderIn -= dt;
  if (brain.wanderIn <= 0) {
    brain.wanderIn = m.rng.range(1.5, 4);
    brain.wanderAngle += m.rng.range(-1.6, 1.6);
  }
  const wander = threat > 0.3 ? 0.2 : 0.6;
  fx += Math.cos(brain.wanderAngle) * wander;
  fy += Math.sin(brain.wanderAngle) * wander;
  const { width, height } = m.rules.world;
  const edge = (dist: number): number => (dist < EDGE ? 2 * (1 - dist / EDGE) : 0);
  fx += edge(p.x) - edge(width - p.x);
  fy += edge(p.y) - edge(height - p.y);

  // Ease toward the wanted direction; pulls that cancel out slow the bot down instead of flipping it.
  const k = 1 - Math.exp(-TURN_RATE * dt);
  brain.moveX += (fx - brain.moveX) * k;
  brain.moveY += (fy - brain.moveY) * k;
  const len = Math.hypot(brain.moveX, brain.moveY);
  const speed = Math.min(1, len / 0.4);
  p.input.moveX = len > 0.01 ? (brain.moveX / len) * speed : 0;
  p.input.moveY = len > 0.01 ? (brain.moveY / len) * speed : 0;
  if (len > 0.05) p.input.aim = Math.atan2(brain.moveY, brain.moveX);

  if (p.pendingPicks > 0) {
    brain.pickIn -= dt;
    if (brain.pickIn <= 0) {
      brain.pickIn = m.rng.range(0.5, 2);
      // Every life commits to one favourite tree (most points go there), so bots show a playstyle.
      const rankOf = (x: Parameters<typeof spentIn>[1] extends (t: infer T) => number ? T : never): number => p.talents.get(x) ?? 0;
      const trees = m.registry.content.trees;
      if (!brain.favorite || trees.every((tree) => spentIn(tree, rankOf) === 0)) brain.favorite = m.rng.pick(trees).id;
      const options = m.takeableTalents(p);
      if (options.length) {
        const weights = options.map((t) => (m.registry.treeOf.get(t)!.id === brain.favorite ? 40 : 1));
        let roll = m.rng.next() * weights.reduce((a, b) => a + b, 0);
        let choice = options[0]!;
        for (let i = 0; i < options.length; i++) {
          roll -= weights[i]!;
          if (roll < 0) {
            choice = options[i]!;
            break;
          }
        }
        m.pick(p, m.registry.talentIndex.get(choice)!);
      }
    }
  }
}
