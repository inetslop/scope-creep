/** The "The exit" branch: nodes for surviving the leak. */
export interface ExitNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** seconds before the enemy reaches the exit that the leak warning starts */
  lead: number;
}

/** One node for now, The long watch: the leak warning starts 5 s out instead of 3 s. */
export const EXIT_NODES: readonly ExitNode[] = [
  { id: 'long-watch', name: 'The long watch', line: 'the leak warning starts 5 s out', price: 30, lead: 5 },
];
