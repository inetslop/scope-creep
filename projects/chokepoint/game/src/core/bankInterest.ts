/** Bank interest: 5% of the run's gold at every wave start, floored, paid only from 1 up, capped at +10. Run gold, never coins. */
export function bankInterest(gold: number): number {
  const pay = Math.floor(gold * 0.05);
  return pay >= 1 ? Math.min(pay, 10) : 0;
}
