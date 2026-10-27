/**
 * Crop schedule (pure logic). The safe area is 100% of the arena until `startSec`,
 * shrinks linearly to `endFraction` of the arena by `endSec`, and holds there.
 * Standing in the cropped margin burns for `burnPerSec` per second. See
 * src/systems/CropSystem.ts for the engine-side margin, crop marks and burn.
 */
export const CROP = { startSec: 720, endSec: 1020, endFraction: 0.7, burnPerSec: 5 } as const;

/** Fraction of the arena (scaled about its center) that is safe at the given run time. */
export function cropSafeFraction(timeSec: number): number {
  if (timeSec <= CROP.startSec) return 1;
  if (timeSec >= CROP.endSec) return CROP.endFraction;
  const t = (timeSec - CROP.startSec) / (CROP.endSec - CROP.startSec);
  return 1 - t * (1 - CROP.endFraction);
}
