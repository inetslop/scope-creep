/** The "The claim" branch: nodes that change what a run pays instead of the run's start. */
export interface ClaimNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** Coins one clean wave pays in the run's coin formula while this node is owned. */
  pay: number;
  /** Coins a flawless run pays in the run's coin formula while this node is owned. */
  flawless: number;
  requires: string | null;
}

/** The branch's two nodes: Clean ×2 doubles what each clean wave pays, then Flawless pays a
 * flawless run ten coins (it needs Clean ×2, like the deeper nodes of the other branches). */
export const CLAIM_NODES: readonly ClaimNode[] = [
  { id: 'clean2', name: 'Clean ×2', line: 'each clean wave pays 2 coins instead of 1', price: 30, pay: 2, flawless: 0, requires: null },
  { id: 'flawless', name: 'Flawless', line: 'a flawless run pays 10 coins', price: 30, pay: 0, flawless: 10, requires: 'clean2' },
];

/** What one clean wave pays in the run's coin formula: the node's pay once it is owned, else 1. */
export function cleanWavePay(owned: readonly string[]): number {
  const node = CLAIM_NODES.find((n) => owned.includes(n.id));
  return node ? node.pay : 1;
}

/** What a flawless run pays in the run's coin formula: the owned claim nodes' flaw pays added, 0 when none has one. */
export function flawlessPay(owned: readonly string[]): number {
  let pay = 0;
  for (const node of CLAIM_NODES) if (owned.includes(node.id)) pay += node.flawless;
  return pay;
}
