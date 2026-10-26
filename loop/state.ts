import fs from 'node:fs';
import path from 'node:path';
import { AGENT_DIR } from './paths.ts';

/** Small per-machine runner state in .agent/state.json. */
export interface RunnerState {
  lastPoRunAt?: string;
  poCycles: number;
  /** Validation problems from the last PO cycle, shown to the PO next time so it can learn. */
  poFeedback: string[];
  /** sha1 of game/package-lock.json the last time `npm ci` ran in game/. */
  gameDepsHash?: string;
}

const FILE = path.join(AGENT_DIR, 'state.json');

export function loadState(): RunnerState {
  try {
    return { poCycles: 0, poFeedback: [], ...(JSON.parse(fs.readFileSync(FILE, 'utf8')) as Partial<RunnerState>) };
  } catch {
    return { poCycles: 0, poFeedback: [] };
  }
}

export function saveState(state: RunnerState): void {
  fs.mkdirSync(AGENT_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}
