import type { TowerSpec } from './augments';

/** Where a tower stands and what it is (a structural copy of entities/Tower; core never imports entities/). */
export interface TollTower {
  spec: TowerSpec;
}

/**
 * The gold every leak at the exit pays while the towers stand (core/augments.ts keeps the sum in
 * each spec): each Toll tower pays its copies' toll once, from anywhere on the board.
 */
export function tollPay(towers: readonly TollTower[]): number {
  let pay = 0;
  for (const t of towers) pay += t.spec.tollPerLeak;
  return pay;
}
