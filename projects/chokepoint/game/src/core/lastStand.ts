import type { RunState } from './run';

/** Last stand: on in a normal run at exactly one life; off in the Iron mode (its one life is the
 * chosen risk, not a last stand) and off at two or more. A state, re-checked everywhere. */
export function isLastStand(run: RunState): boolean {
  return run.mode === 'play' && run.lives === 1;
}

/** The kill's own gold (the enemy's bounty), doubled while last stand is on. Mint's +1 per copy is added on top by the caller and never doubled. */
export function killGold(run: RunState, base: number): number {
  return isLastStand(run) ? base * 2 : base;
}
