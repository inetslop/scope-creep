/** The "The kill" branch: nodes for how a kill pays. */
export interface KillNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** gold every kill pays extra, added to the bounty before the quiet and last-stand doublings (The bounty: 1) */
  bounty: number;
  /** seconds the kill chain's window gains while the node is owned, additive with Feast's per-copy 0.4 s (The window: 0.5); absent when the node doesn't touch the window */
  chainWindowSec?: number;
}

/** Two nodes: The bounty (every kill pays +1 gold) and The window (the kill chain's window +0.5 s). */
export const KILL_NODES: readonly KillNode[] = [
  { id: 'bounty', name: 'The bounty', line: 'every kill pays +1 gold', price: 30, bounty: 1 },
  { id: 'window', name: 'The window', line: "the kill chain's window +0.5 s", price: 30, bounty: 0, chainWindowSec: 0.5 },
];
