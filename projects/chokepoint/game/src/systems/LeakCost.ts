import { START } from '../config';
import type { RunState } from '../core/run';
import type { Board } from './Board';
import type { FxSystem } from './FxSystem';
import { leakCost } from './fx/leakCost';

/**
 * The first leak's price tag: the run's first leak shows "leaks cost a life" at the exit gate (fx/leakCost.ts),
 * teaching Pillar 8 at the moment of paying. Reads run.lives only — it decides on the first update so a run
 * resumed below its starting lives has already seen it and never chips. No sound, no input, nothing else changes.
 */
export class LeakCost {
  private readonly run: RunState;
  private readonly fx: FxSystem;
  private readonly x: number;
  private readonly y: number;
  private seen: boolean | null = null; // decided on the FIRST update, see note
  constructor(run: RunState, fx: FxSystem, board: Board) {
    this.run = run;
    this.fx = fx;
    const pts = board.path.points; // same exit anchor as ExitWarning's constructor
    this.x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    this.y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
  }

  update(_dt: number): void {
    if (this.seen === null) this.seen = this.run.lives < START.lives; // resumed below start => already seen
    if (this.seen || this.run.lives >= START.lives) return;
    this.seen = true;
    leakCost(this.fx, this.x, this.y);
  }

  broken(): string | undefined {
    return Number.isFinite(this.x) && Number.isFinite(this.y) ? undefined : `leak cost at (${this.x}, ${this.y})`;
  }
}
