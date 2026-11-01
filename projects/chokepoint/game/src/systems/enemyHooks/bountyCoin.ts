import type { Point } from '../../core/path';
import { goldCoin } from '../fx/goldCoin';
import type { MakeEnemyHook } from './hook';

/**
 * The trail weighs the bounty: one extra coin on the kill-gold trail (killCoin.ts, systems/fx/
 * goldCoin.ts) per 10 gold of the enemy's own bounty — two more at 20 or more, a boss's three-coin
 * train. Counted from the data gold `enemy.def.gold`, before the quiet wave's double, the last
 * stand's double and Lean's thinning: those never add coins. Each extra coin is the trail's own
 * coin on the trail's own arc, ~80 ms behind the one before. The extra coins are not killCoin's
 * concern (its cap and timing are untouched); they stay bounded because goldCoin returns early
 * when fx is full.
 */
export const bountyCoin: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const extra = enemy.def.gold >= 20 ? 2 : enemy.def.gold >= 10 ? 1 : 0;
    if (extra === 0) return;
    const spot = ctx.scene.registry.get('statsGold') as Point | undefined;
    if (!spot) return;
    const px = ctx.board.toScreen({ x: 1, y: 0 }).x - ctx.board.toScreen({ x: 0, y: 0 }).x; // CSS px per board unit
    const from = { x: enemy.x, y: enemy.y - 20 }; // the gold pop's anchor, as killCoin.ts
    const to = ctx.board.toBoard(spot);
    for (let i = 1; i <= extra; i++) {
      ctx.scene.time.delayedCall(80 * i, () => {
        if (ctx.fx.full) return;
        goldCoin(ctx.fx, from, to, 10 / px, 24 / px); // the trail's own coin: same look, size and arc
      });
    }
  },
});
