import type { Rng } from './rng';

/**
 * Swatch-cascade timing for The Palette (pure logic): the first swatch
 * detaches after `firstDetachSec` and falls straight down for `fallSec`; after
 * each swatch resolves (destroyed or sunk) the next one detaches
 * `detachDelaySec` later. Each swatch falls at least `minGap` away from the
 * previous one's X, at least `edgeMargin` inside the arena edges. BossSystem
 * owns the writes; see tests/core/swatchCascade.test.ts.
 */
export type SwatchCascadePhase = 'idle' | 'falling' | 'waiting' | 'done';

export interface SwatchCascadeTiming {
  count: number;
  firstDetachSec: number;
  detachDelaySec: number;
  fallSec: number;
  minGap: number;
  edgeMargin: number;
}

export const SWATCH_CASCADE: SwatchCascadeTiming = {
  count: 5,
  firstDetachSec: 1,
  detachDelaySec: 1.2,
  fallSec: 6,
  minGap: 120,
  edgeMargin: 60,
};

export class SwatchCascade {
  private readonly arenaSize: number;
  private readonly rng: Rng;
  private readonly timing: SwatchCascadeTiming;
  private t = 0;
  private resolved = 0;
  private current: SwatchCascadePhase = 'idle';
  private nextDetachAt = 0;
  private x = 0;
  private fallStart = 0;
  private prevX: number | null = null;

  constructor(arenaSize: number, rng: Rng, timing: SwatchCascadeTiming = SWATCH_CASCADE) {
    this.arenaSize = arenaSize;
    this.rng = rng;
    this.timing = timing;
    this.reset();
  }

  get phase(): SwatchCascadePhase {
    return this.current;
  }

  /** The swatch currently falling, or -1 when none is. */
  get activeIndex(): number {
    return this.current === 'falling' ? this.resolved : -1;
  }

  /** Horizontal position of the falling swatch, chosen at detachment. */
  get activeX(): number {
    return this.x;
  }

  /** Vertical position of the falling swatch: -half at detach, +half at sink, clamped. */
  get activeY(): number {
    if (this.current !== 'falling') return 0;
    const half = this.arenaSize / 2;
    const y = -half + ((this.t - this.fallStart) / this.timing.fallSec) * this.arenaSize;
    return Math.max(-half, Math.min(half, y));
  }

  get resolvedCount(): number {
    return this.resolved;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.current === 'idle' || this.current === 'waiting') {
      if (this.t >= this.nextDetachAt) this.detach();
    } else if (this.current === 'falling' && this.t - this.fallStart >= this.timing.fallSec) {
      this.resolve();
    }
  }

  /** Resolves the falling swatch early (it was destroyed). No-op otherwise. */
  destroyActive(): void {
    if (this.current !== 'falling') return;
    this.resolve();
  }

  reset(): void {
    this.t = 0;
    this.resolved = 0;
    this.current = 'idle';
    this.nextDetachAt = this.timing.firstDetachSec;
    this.prevX = null;
    this.x = 0;
    this.fallStart = 0;
  }

  private detach(): void {
    this.x = this.pickX();
    this.fallStart = this.t;
    this.current = 'falling';
    this.prevX = this.x;
  }

  private resolve(): void {
    this.resolved += 1;
    if (this.resolved >= this.timing.count) {
      this.current = 'done';
    } else {
      this.current = 'waiting';
      this.nextDetachAt = this.t + this.timing.detachDelaySec;
    }
  }

  /** A random X at least `edgeMargin` inside the arena and `minGap` from the previous swatch. */
  private pickX(): number {
    const half = this.arenaSize / 2;
    const lo = -half + this.timing.edgeMargin;
    const hi = half - this.timing.edgeMargin;
    const prev = this.prevX;
    let x = this.rng.range(lo, hi);
    if (prev === null || Math.abs(x - prev) >= this.timing.minGap) return x;
    for (let i = 1; i < 8; i++) {
      x = this.rng.range(lo, hi);
      if (Math.abs(x - prev) >= this.timing.minGap) return x;
    }
    // Fallback (unreachable in practice): the far edge always satisfies both constraints.
    return prev <= 0 ? hi : lo;
  }
}
