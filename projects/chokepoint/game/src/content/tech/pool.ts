/** The "The pool" branch: nodes that grow the game's content instead of changing the run's start. */
export interface PoolNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** The id of the augment this node unlocks; the augment's own gate reads this from the purchased list. */
  unlocks: string;
}

/** Three nodes for now: Haste, Momentum and Mend, each adding its augment to the draft. */
export const POOL_NODES: readonly PoolNode[] = [
  { id: 'haste', name: 'Haste', line: 'unlocks the Haste augment in the draft', price: 25, unlocks: 'haste' },
  { id: 'momentum', name: 'Momentum', line: 'unlocks the Momentum augment in the draft', price: 30, unlocks: 'momentum' },
  { id: 'mend', name: 'Mend', line: 'unlocks the Mend augment in the draft', price: 30, unlocks: 'mend' },
];
