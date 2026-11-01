/** The "The board" branch: four nodes that change the board of every new run instead of the run's start. */
export interface BoardNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** extra bends a new run's road gets */
  bends: number;
  /** the road's length in a new run's board: 1 = unchanged, 1.25 = 25% longer */
  lengthMul: number;
  /** the choke cells a new run's board carries: 1 = today's guarantee, 2 = the road folds back twice */
  chokes: number;
  /** the switchback fold in a new run's road: true when the road folds back on itself mid-board */
  fold: boolean;
}

/** Four nodes: One more bend, a windier road; The long way, a longer one; Two chokes, a road that folds back twice; The switchback, a road with a fold mid-board. */
export const BOARD_NODES: readonly BoardNode[] = [
  { id: 'one-more-bend', name: 'One more bend', line: "new runs' roads wind one turn further", price: 10, bends: 1, lengthMul: 1, chokes: 1, fold: false },
  { id: 'long-way', name: 'The long way', line: "new runs' roads are 25% longer", price: 30, bends: 0, lengthMul: 1.25, chokes: 1, fold: false },
  { id: 'two-chokes', name: 'Two chokes', line: 'two double-cover cells instead of one', price: 30, bends: 0, lengthMul: 1, chokes: 2, fold: false },
  { id: 'switchback', name: 'The switchback', line: 'the road folds back: a cell between two stretches', price: 10, bends: 0, lengthMul: 1, chokes: 1, fold: true },
];
