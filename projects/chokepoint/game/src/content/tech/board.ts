/** The "The board" branch: nodes that change the board of every new run instead of the run's start. */
export interface BoardNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** extra bends a new run's road gets */
  bends: number;
}

/** One node for now: One more bend, a windier road in every new run. */
export const BOARD_NODES: readonly BoardNode[] = [
  { id: 'one-more-bend', name: 'One more bend', line: "new runs' roads wind one turn further", price: 30, bends: 1 },
];
