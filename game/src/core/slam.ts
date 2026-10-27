/**
 * Slam-cycle timing for the Platen (pure logic): a `periodSec` crawl toward the
 * player, a `telegraphSec` flatten, then a `rippleSec` knockback wave, repeating.
 * The wave itself deals no damage; SpawnSystem owns the shove. See tests/core/slam.test.ts.
 */
export type SlamPhase = 'idle' | 'telegraph' | 'ripple';

export interface SlamTiming {
  periodSec: number;
  telegraphSec: number;
  rippleSec: number;
}

export const PLATEN_SLAM: SlamTiming = { periodSec: 5, telegraphSec: 0.5, rippleSec: 0.25 };

/** The shove: wave radius and impulse strengths in world units (no damage). */
export const SLAM = { radius: 160, playerKnock: 220, enemyKnock: 120, flatten: 0.4 } as const;

export class SlamCycle {
  private readonly timing: SlamTiming;
  private t = 0;

  constructor(timing: SlamTiming = PLATEN_SLAM) {
    this.timing = timing;
  }

  /** Length of one full crawl -> telegraph -> ripple cycle. */
  get cycleSec(): number {
    return this.timing.periodSec + this.timing.telegraphSec + this.timing.rippleSec;
  }

  /** Cycle time at which the wave fires: the end of the telegraph. */
  private get slamAt(): number {
    return this.timing.periodSec + this.timing.telegraphSec;
  }

  get phase(): SlamPhase {
    if (this.t < this.timing.periodSec) return 'idle';
    if (this.t < this.slamAt) return 'telegraph';
    return 'ripple';
  }

  /** 0 during idle, 0..1 across the telegraph, 0..1 across the ripple. */
  get phaseProgress(): number {
    if (this.phase === 'idle') return 0;
    if (this.phase === 'telegraph') {
      const start = this.timing.periodSec;
      return (this.t - start) / this.timing.telegraphSec;
    }
    const start = this.slamAt;
    return Math.min(1, (this.t - start) / this.timing.rippleSec);
  }

  /** Advances the cycle; true exactly once per cycle, on the frame crossing into the ripple. */
  update(dt: number): boolean {
    const prev = this.t;
    this.t = (this.t + dt) % this.cycleSec;
    if (this.t < prev) return false; // wrapped around: the crossing happened on the previous cycle
    return prev < this.slamAt && this.t >= this.slamAt;
  }

  reset(): void {
    this.t = 0;
  }
}
