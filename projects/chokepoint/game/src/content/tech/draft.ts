/**
 * The "The draft" branch of the tech tree: what a new run's draft gets from the owned nodes.
 * Like the "Run start" nodes these are lasting purchases (core/tech.ts spends them), but they
 * bend a run's draft and slot prices instead of its starting gold and lives, so they carry no
 * gold/life numbers of their own: each node's `kind` says what it does.
 */
export interface DraftNode {
  id: string;
  name: string;
  line: string;
  price: number;
  requires: string | null;
  /** What the node buys: 'slot2' takes gold off a tower's second slot, 'fourth' adds a pre-wave-1 card. */
  kind: 'slot2' | 'fourth';
}

/**
 * One branch ("The draft"): two slot nodes, each another −5 on the same second slot (together
 * 10, floored at 5 in core/techEffects.ts), and the fourth card for the pre-wave-1 draft.
 */
export const DRAFT_NODES: readonly DraftNode[] = [
  { id: 'slot2-1', name: 'Slot II −5', line: "a tower's second slot costs 5 less", price: 10, requires: null, kind: 'slot2' },
  { id: 'slot2-2', name: 'Slot II −5', line: "a tower's second slot costs 5 less", price: 20, requires: 'slot2-1', kind: 'slot2' },
  { id: 'fourth-card', name: 'Fourth card', line: 'the pre-wave-1 draft offers a fourth card', price: 15, requires: null, kind: 'fourth' },
];
