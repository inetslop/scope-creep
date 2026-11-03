/** Bank interest: 5% of the run's gold at every wave start, floored, paid only from 1 up, capped (10 by default; The deep vault's 20 via core/tech's bankPayCap). Run gold, never coins. */
export function bankInterest(gold: number, cap: number = 10): number {
  const pay = Math.floor(gold * 0.05);
  return pay >= 1 ? Math.min(pay, cap) : 0;
}
