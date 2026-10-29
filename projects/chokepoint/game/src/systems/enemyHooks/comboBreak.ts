import type { MakeEnemyHook } from './hook';

/** A leak breaks the run's kill-combo chain: the ×N counter, if up, fades out in place. */
export const comboBreak: MakeEnemyHook = ({ fx }) => ({
  onLeak: () => { fx.breakCombo(); },
});
