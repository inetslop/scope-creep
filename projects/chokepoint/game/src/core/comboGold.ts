/** What a kill-chain milestone pays: the fifth kill of a chain +2, the tenth +4; every other kill 0. */
export function comboGoldBonus(chain: number): number {
  if (chain === 5) return 2;
  if (chain === 10) return 4;
  return 0;
}
