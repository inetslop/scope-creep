/**
 * Arm-sweep timing for The Grid (pure logic): a `periodSec` rest, a
 * `telegraphSec` flash, then a `sweepSec` half-turn (180 degrees) sweep of two
 * opposite arms, repeating. BossSystem owns the writes; see tests/core/gridSweep.test.ts.
 */
export type GridSweepPhase = 'rest' | 'telegraph' | 'sweep';

export interface GridSweepTiming {
  periodSec: number;
  telegraphSec: number;
  sweepSec: number;
}

export const GRID_SWEEP: GridSweepTiming = { periodSec: 4, telegraphSec: 0.5, sweepSec: 1.5 };

export class GridSweep {
  private readonly timing: GridSweepTiming;
  private t = 0;

  constructor(timing: GridSweepTiming = GRID_SWEEP) {
    this.timing = timing;
  }

  /** Length of one full rest -> telegraph -> sweep cycle. */
  get cycleSec(): number {
    return this.timing.periodSec + this.timing.telegraphSec + this.timing.sweepSec;
  }

  get phase(): GridSweepPhase {
    if (this.t < this.timing.periodSec) return 'rest';
    if (this.t < this.timing.periodSec + this.timing.telegraphSec) return 'telegraph';
    return 'sweep';
  }

  /** 0 before the sweep starts, 1 when it has swept a full half-turn. */
  get sweepProgress(): number {
    const start = this.timing.periodSec + this.timing.telegraphSec;
    if (this.t <= start) return 0;
    return Math.min(1, (this.t - start) / this.timing.sweepSec);
  }

  update(dt: number): void {
    this.t = (this.t + dt) % this.cycleSec;
  }

  reset(): void {
    this.t = 0;
  }
}

/** Distance from point (px, py) to the segment (ax, ay)-(bx, by), clamped at the ends. */
export function pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby));
}
