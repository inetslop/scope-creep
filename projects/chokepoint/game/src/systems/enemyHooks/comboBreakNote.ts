import type { MakeEnemyHook } from './hook';

/** A leak that breaks a real kill-combo chain (2+ kills) plays the soft two-note fall (Sfx.comboBreak);
 *  a leak with no chain, or one that breaks only a single kill, plays nothing.
 *  It must run ahead of the comboBreak hook, which resets the chain to zero. */
export const comboBreakNote: MakeEnemyHook = ({ fx, sfx }) => ({
  onLeak: () => {
    if (fx.chain >= 2) sfx?.comboBreak();
  },
});
