/** The "The wave" branch: nodes that change how a run plays instead of the run's start or board's shape. */
export interface WaveNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the far gate (core/farGate.ts) on every new run's board, no roll */
  farGate: boolean;
}

/** One node for now, The door: with it, every board carries the far gate (a second entrance, a third of each non-boss wave through it). */
export const WAVE_NODES: readonly WaveNode[] = [
  { id: 'door', name: 'The door', line: 'the far gate on every board', price: 30, farGate: true },
];
