/** Bank interest: the run's gold at every wave start at the bank's rate (5 by default; core/tech's bankRate), floored, paid only from 1 up, capped (10 by default; The deep vault's 20 via core/tech's bankPayCap). Run gold, never coins. */
export function bankInterest(gold: number, cap: number = 10, rate: number = 5): number {
  const pay = Math.floor((gold * rate) / 100);
  return pay >= 1 ? Math.min(pay, cap) : 0;
}

/** The bank's pay with The last stand's vault: the normal pay (bankInterest, floor and cap first), then ×2 while the last stand is on. */
export function bankDue(gold: number, cap: number, rate: number, lastStand: boolean): number {
  const pay = bankInterest(gold, cap, rate);
  return lastStand ? pay * 2 : pay;
}
