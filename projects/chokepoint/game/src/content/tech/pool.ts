/** The "The pool" branch: nodes that grow the game's content instead of changing the run's start. */
export interface PoolNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** The id of the augment this node unlocks; the augment's own gate reads this from the purchased list. */
  unlocks: string;
}

/** One row for now: Haste, the first node to add an augment to the draft. */
export const POOL_NODES: readonly PoolNode[] = [
  { id: 'haste', name: 'Haste', line: 'unlocks the Haste augment in the draft', price: 25, unlocks: 'haste' },
];
