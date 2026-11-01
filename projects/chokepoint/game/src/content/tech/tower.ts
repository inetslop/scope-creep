/** The "The tower" branch: nodes that change how a run's towers are sold back. */
export interface TowerNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the refund per 10 paid when selling a tower's slots, 7 per 10 when no node gives more */
  refund: number;
}

/** One node for now, Soft sell: a sell refunds 80% of the slots' cost instead of 70%. */
export const TOWER_NODES: readonly TowerNode[] = [
  { id: 'soft-sell', name: 'Soft sell', line: 'a sell pays 80% of its slots\' cost, not 70%', price: 30, refund: 8 },
];
