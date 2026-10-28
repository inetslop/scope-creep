import { comboGoldBonus } from '../../core/comboGold';
import type { MakeEnemyHook } from './hook';
import { comboGoldPop } from '../fx/comboGold';

/** The chain's milestones pay extra gold: the fifth kill +2, the tenth +4 (core/comboGold.ts). */
export const comboGold: MakeEnemyHook = ({ run, fx }) => ({
  onKill({ enemy }) {
    const bonus = comboGoldBonus(fx.chain);
    if (bonus <= 0) return;
    run.gold += bonus;
    run.goldEarned += bonus;
    comboGoldPop(fx, enemy.x, enemy.y - 20, bonus);
  },
});
