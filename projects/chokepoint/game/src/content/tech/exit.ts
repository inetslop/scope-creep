/** The "The exit" branch: nodes for surviving the leak. */
export interface ExitNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** seconds before the enemy reaches the exit that the leak warning starts */
  lead: number;
  /** the lives a leaking Block costs on every run after (The long watch: 2, unchanged; One life a Block: 1) */
  blockCost: number;
}

/** Two nodes: The long watch (the leak warning starts 5 s out); One life a Block (a leaking Block costs 1 life). */
export const EXIT_NODES: readonly ExitNode[] = [
  { id: 'long-watch', name: 'The long watch', line: 'the leak warning starts 5 s out', price: 30, lead: 5, blockCost: 2 },
  { id: 'one-life-block', name: 'One life a Block', line: 'a Block that leaks costs 1 life instead of 2', price: 30, lead: 3, blockCost: 1 },
];
