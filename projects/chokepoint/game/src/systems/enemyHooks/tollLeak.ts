import { tollPay } from '../../core/toll';
import type { MakeEnemyHook } from './hook';

/**
 * The toll (core/toll.ts): while a Toll tower stands, every leak pays gold on top of its life cost —
 * run gold, not coins, so the tally and the claim recipe never see it. One small gold pop at the
 * exit, ~100 ms after the leak's jolt, with a quiet coin blip at the same moment; a leak with no
 * Toll tower on the board is byte-identical to today. The spot is captured: the enemy returns to
 * the pool before the pop lands.
 */
export const tollLeak: MakeEnemyHook = ({ run, fx, towers, sfx }) => ({
  onLeak(enemy) {
    const pay = tollPay(towers());
    if (pay <= 0) return; // no Toll tower stands
    const x = enemy.x, y = enemy.y; // captured: it returns to the pool before the pop lands
    run.gold += pay; // run gold, not coins: the tally and claim recipe never see it
    fx.scene.time.delayedCall(100, () => {
      fx.popText(x - 40, y - 20, `+${pay}`);
      sfx?.coinBlip();
    });
  },
});
