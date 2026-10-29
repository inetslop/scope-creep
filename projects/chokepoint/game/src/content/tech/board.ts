/** The "The board" branch: two nodes that change the board of every new run instead of the run's start. */
export interface BoardNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** extra bends a new run's road gets */
  bends: number;
  /** the road's length in a new run's board: 1 = unchanged, 1.25 = 25% longer */
  lengthMul: number;
}

/** Two nodes: One more bend, a windier road in every new run, and The long way, a longer one. */
export const BOARD_NODES: readonly BoardNode[] = [
  { id: 'one-more-bend', name: 'One more bend', line: "new runs' roads wind one turn further", price: 30, bends: 1, lengthMul: 1 },
  { id: 'long-way', name: 'The long way', line: "new runs' roads are 25% longer", price: 30, bends: 0, lengthMul: 1.25 },
];
