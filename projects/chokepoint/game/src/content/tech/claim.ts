/** The "The claim" branch: nodes that change what a run pays instead of the run's start. */
export interface ClaimNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** Coins one clean wave pays in the run's coin formula while this node is owned. */
  pay: number;
}

/** One node for now: Clean ×2, doubling what each clean wave pays in the coin formula. */
export const CLAIM_NODES: readonly ClaimNode[] = [
  { id: 'clean2', name: 'Clean ×2', line: 'each clean wave pays 2 coins instead of 1', price: 30, pay: 2 },
];

/** What one clean wave pays in the run's coin formula: the node's pay once it is owned, else 1. */
export function cleanWavePay(owned: readonly string[]): number {
  const node = CLAIM_NODES.find((n) => owned.includes(n.id));
  return node ? node.pay : 1;
}
