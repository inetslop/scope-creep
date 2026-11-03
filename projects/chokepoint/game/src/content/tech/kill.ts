/** The "The kill" branch: nodes for how a kill pays. */
export interface KillNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** gold every kill pays extra, added to the bounty before the quiet and last-stand doublings (The bounty: 1) */
  bounty: number;
}

/** One node for now: The bounty (every kill pays +1 gold). */
export const KILL_NODES: readonly KillNode[] = [
  { id: 'bounty', name: 'The bounty', line: 'every kill pays +1 gold', price: 30, bounty: 1 },
];
