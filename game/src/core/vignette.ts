/**
 * Low-HP vignette latch (pure logic). The page reads the danger: when the
 * player's HP fraction (hp / maxHp) is at or below `onAt` (25%) the vignette
 * latches on; it latches off only when the fraction rises back above `offAt`
 * (30%). Between the two thresholds it holds whatever state it is in, so the
 * shadow does not flicker on and off while regen climbs back across the
 * threshold. Pure readability: the latch changes nothing in the run. See
 * src/systems/VignetteSystem.ts for the engine-side bands and pulsing rule.
 */
export const VIGNETTE = { onAt: 0.25, offAt: 0.3 } as const;

export class VignetteState {
  /** True while the page shows the danger vignette. */
  on = false;
  /** Advances the latch given the current HP fraction (0..1). */
  tick(hpFraction: number): void {
    if (hpFraction <= VIGNETTE.onAt) this.on = true;
    else if (hpFraction > VIGNETTE.offAt) this.on = false;
    // between onAt and offAt (inclusive of offAt): hold — no flicker while regen climbs back
  }
}
