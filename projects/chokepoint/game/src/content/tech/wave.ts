/** The "The wave" branch: nodes that change how a run plays instead of the run's start or board's shape. */
export interface WaveNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the far gate (core/farGate.ts) on every new run's board, no roll */
  farGate: boolean;
  /** the run's walk-speed factor on every enemy of every new run (The thin road: 0.9); absent when the node doesn't touch speed */
  walkMul?: number;
}

/** Two nodes: The door gives every board the far gate (a second entrance, a third of each non-boss wave through it); The thin road slows every enemy 10%. */
export const WAVE_NODES: readonly WaveNode[] = [
  { id: 'door', name: 'The door', line: 'the far gate on every board', price: 30, farGate: true },
  { id: 'thin-road', name: 'The thin road', line: 'every enemy walks 10% slower, for every run after', price: 30, farGate: false, walkMul: 0.9 },
];
