import type { Point } from '../../core/path';
import { goldCoin } from '../fx/goldCoin';
import type { MakeEnemyHook } from './hook';

/**
 * The kill's gold trail (systems/fx/goldCoin.ts): one small coin per kill that pays gold, from
 * the kill spot (the gold pop's anchor) to the gold number in the stats card (ui/hud/StatsCard.ts,
 * shared as 'statsGold' through the scene registry). At most 8 in flight: a coin flies 200 ms,
 * so a kill that starts 8 or more launches in the last 250 ms shows only its pop.
 */
export const killCoin: MakeEnemyHook = (ctx) => {
  let launched: number[] = [];
  return {
    onKill({ enemy, paid }) {
      if (paid <= 0) return;
      const now = ctx.scene.time.now;
      launched = launched.filter((t) => now - t < 250);
      if (launched.length >= 8) return;
      launched.push(now);
      const spot = ctx.scene.registry.get('statsGold') as Point | undefined;
      if (!spot) return;
      // CSS pixels per board unit at the current zoom: the coin stays ~10 px on screen, the arc ~24 px.
      const px = ctx.board.toScreen({ x: 1, y: 0 }).x - ctx.board.toScreen({ x: 0, y: 0 }).x;
      goldCoin(ctx.fx, { x: enemy.x, y: enemy.y - 20 }, ctx.board.toBoard(spot), 10 / px, 24 / px);
    },
  };
};
