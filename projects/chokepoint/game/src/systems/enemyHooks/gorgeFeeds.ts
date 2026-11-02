import { CELL } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import { gorgeTell } from '../fx/gorgeTell';
import { mendRing } from '../fx/mendRing';
import type { MakeEnemyHook } from './hook';

/**
 * The Gorge's feed (content/enemies/gorge.ts): event-driven, not on a clock — while the Gorge
 * lives, every enemy other than the Gorge that leaks makes it flash white and restore `frac` of
 * its own max hp, with a thin red ring in its own color contracting from `ringCells` cells onto
 * it, up to `max` times. Never a self-feed (a leaked Gorge is a failure, not a food), never a
 * revive: the heal only targets the live Gorge, capped at its max, and a killed Gorge is never
 * found. The first feeding teaches it once, at its spot (systems/fx/gorgeTell.ts).
 */
export const gorgeFeeds: MakeEnemyHook = ({ enemies, fx }) => {
  let told = false; // the teach is once per run, kept in the closure; a new run makes a new hook
  return {
    onLeak(leaker: Enemy): void {
      if (leaker.def.id === 'gorge') return; // its own leak is a failure, not a feed
      const g = enemies.all.find((e) => e.active && e.def.feeds);
      if (g === undefined) return;
      const rule = g.def.feeds!;
      if (g.feedsUsed >= rule.max) return; // the feeds are spent; a third leak feeds nothing
      g.feedsUsed += 1;
      g.flash = 0.06; g.setTintFill(0xffffff);
      g.hp = Math.min(g.maxHp, g.hp + g.maxHp * rule.frac); // a heal, never a revive
      const x = g.x, y = g.y; // its spot, read once
      mendRing(fx, x, y, rule.ringCells, g.def.look.size * CELL, PALETTE[g.def.look.color]); // the closing ring, in its own red
      if (!told) { gorgeTell(fx, x, y); told = true; } // the one-time teach, at its spot
    },
  };
};
