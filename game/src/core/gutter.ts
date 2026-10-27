/**
 * Gutter schedule (pure logic). After `startSec` (14:00), every `periodSec` a
 * 40-unit-wide vertical band of ink sweeps across the crop-safe area: its
 * center crosses the safe width in exactly `crossSec` seconds, entering just
 * off one safe edge and exiting just off the other, direction alternating per
 * sweep. In the `telegraphSec` before each entry a thin red rule pulses at the
 * entering edge. Standing in the band burns for `burnPerSec` per second. See
 * src/systems/GutterSystem.ts for the engine-side band, telegraph and burn.
 */
export const GUTTER = { startSec: 840, periodSec: 20, widthUnits: 40, crossSec: 4, telegraphSec: 1.5, burnPerSec: 4 } as const;

export interface GutterPhase {
  active: boolean;          // true in [entry, entry + crossSec)
  sweep: number;            // 0 = first, enters at 840 s
  direction: 1 | -1;        // 1 = left→right (enters left safe edge), -1 = right→left; alternates per sweep
  centerFraction: number;   // band center as fraction of safe width: 0 = left safe edge, 1 = right (only when active)
  telegraph: boolean;       // true in [entry − telegraphSec, entry) — half-open, never coexists with active
  telegraphAlpha: number;   // 0→0.6→0 triangle pulse, 1 s period, anchored at entry − telegraphSec; 0 outside window
}

export function gutterAt(timeSec: number): GutterPhase {
  const p: GutterPhase = { active: false, sweep: 0, direction: 1, centerFraction: 0, telegraph: false, telegraphAlpha: 0 };
  const firstTelegraph = GUTTER.startSec - GUTTER.telegraphSec;
  if (timeSec < firstTelegraph) return p;
  const sweep = Math.floor((timeSec - firstTelegraph) / GUTTER.periodSec);
  const entry = GUTTER.startSec + sweep * GUTTER.periodSec;
  p.sweep = sweep; p.direction = sweep % 2 === 0 ? 1 : -1;
  if (timeSec >= entry - GUTTER.telegraphSec && timeSec < entry) {
    p.telegraph = true;
    const phase = (timeSec - (entry - GUTTER.telegraphSec)) % 1;
    p.telegraphAlpha = 0.6 * (1 - Math.abs(2 * phase - 1));
  } else if (timeSec >= entry && timeSec < entry + GUTTER.crossSec) {
    p.active = true;
    const progress = (timeSec - entry) / GUTTER.crossSec;
    p.centerFraction = p.direction === 1 ? progress : 1 - progress;
  }
  return p;
}
