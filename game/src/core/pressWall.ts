/**
 * The Press wall schedule (pure logic). The leading edge starts at the top of
 * the crop-safe area and advances at `advancePerSec` (a fraction of the safe
 * height per second). Every `stampPeriodSec` it jumps down by `stampJump`,
 * after a `stampTelegraphSec` telegraph (a red rule along the edge, gutter
 * idiom). The first row of type blocks prints at `firstRowSec`, then a new row
 * every `rowPeriodSec`; when a row is fully cleared the wall retracts
 * `retractAmount` over `retractSec`. The progress is clamped to [0, 1]: the
 * bottom of the safe area. BossSystem owns the writes; see
 * tests/core/press.test.ts.
 */
export interface PressWallTiming {
  /** Leading-edge advance, fraction of the safe height per second. */
  advancePerSec: number;
  /** Seconds between stamps. */
  stampPeriodSec: number;
  /** Seconds the red rule telegraphs before each stamp. */
  stampTelegraphSec: number;
  /** The stamp's downward jump, fraction of the safe height. */
  stampJump: number;
  /** Seconds after the Press lands when the first row prints. */
  firstRowSec: number;
  /** Seconds between printed rows. */
  rowPeriodSec: number;
  /** The retract, fraction of the safe height, when a row is cleared. */
  retractAmount: number;
  /** Seconds the retract takes. */
  retractSec: number;
}

export const PRESS_WALL: PressWallTiming = {
  advancePerSec: 1 / 150,
  stampPeriodSec: 5,
  stampTelegraphSec: 1,
  stampJump: 1 / 20,
  firstRowSec: 3,
  rowPeriodSec: 9,
  retractAmount: 1 / 16,
  retractSec: 0.6,
};

export class PressWall {
  private readonly timing: PressWallTiming;
  private time = 0;
  /** Leading-edge fraction of the safe height (0 = top, 1 = bottom). */
  private frac = 0;
  private stampCount = 0;
  private rowCount = 0;
  private retracting = false;
  private retractT = 0;
  private retractFrom = 0;
  private retractTo = 0;

  constructor(timing: PressWallTiming = PRESS_WALL) {
    this.timing = timing;
  }

  /** Leading-edge fraction of the safe height, clamped to [0, 1]; 0 = top, 1 = bottom. */
  get progress(): number {
    return Math.max(0, Math.min(1, this.frac));
  }

  /** Stamps fired so far (edge-detection counter for BossSystem). */
  get stamps(): number {
    return this.stampCount;
  }

  /** Rows printed so far (edge-detection counter for BossSystem). */
  get rows(): number {
    return this.rowCount;
  }

  /** True during the telegraph window before the next stamp. */
  get stampTelegraph(): boolean {
    const next = (this.stampCount + 1) * this.timing.stampPeriodSec;
    return this.time >= next - this.timing.stampTelegraphSec && this.time < next;
  }

  /** 0→0.6→0 triangle pulse during the telegraph (the gutter idiom); 0 outside it. */
  get stampTelegraphAlpha(): number {
    const next = (this.stampCount + 1) * this.timing.stampPeriodSec;
    const start = next - this.timing.stampTelegraphSec;
    if (this.time < start || this.time >= next) return 0;
    const phase = (this.time - start) % 1;
    return 0.6 * (1 - Math.abs(2 * phase - 1));
  }

  update(dt: number): void {
    this.time += dt;
    if (this.retracting) {
      this.retractT += dt;
      const u = Math.min(1, this.retractT / this.timing.retractSec);
      this.frac = this.retractFrom + (this.retractTo - this.retractFrom) * u;
      if (u >= 1) this.retracting = false;
    } else {
      this.frac += this.timing.advancePerSec * dt;
    }
    // A large dt can cross several stamp times at once.
    while (this.time >= (this.stampCount + 1) * this.timing.stampPeriodSec) {
      this.stampCount += 1;
      this.applyJump(this.timing.stampJump);
    }
    while (this.time >= this.timing.firstRowSec + this.rowCount * this.timing.rowPeriodSec) this.rowCount += 1;
    this.frac = Math.max(0, Math.min(1, this.frac));
  }

  /** The wall retracts when the current row is fully cleared. No-op while retracting or before the first row. */
  clearRow(): void {
    if (this.retracting || this.rowCount === 0) return;
    this.retracting = true;
    this.retractT = 0;
    this.retractFrom = this.frac;
    this.retractTo = Math.max(0, this.frac - this.timing.retractAmount);
  }

  reset(): void {
    this.time = 0;
    this.frac = 0;
    this.stampCount = 0;
    this.rowCount = 0;
    this.retracting = false;
    this.retractT = 0;
    this.retractFrom = 0;
    this.retractTo = 0;
  }

  /** A stamp: the edge jumps down; a jump mid-retract shifts the retract's endpoints too. */
  private applyJump(a: number): void {
    this.frac += a;
    if (this.retracting) {
      this.retractFrom += a;
      this.retractTo += a;
    }
  }
}
