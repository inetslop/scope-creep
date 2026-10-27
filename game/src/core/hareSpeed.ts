/**
 * Chase-speed rule for the Hare (pure logic): the Hare starts sluggish and
 * quickens in four steps as it loses HP — one step per full quarter of max HP,
 * capped at the third. Steps up when HP crosses ≤75% / ≤50% / ≤25% of max.
 * The table is literal (not 40 × 1.3^n): the pinned fourth step is 87.9, not
 * 87.88. See tests/core/hareSpeed.test.ts.
 */
export const HARE_STEPS: readonly number[] = [40, 52, 67.6, 87.9];

/** Quickener step 0–3 at the given HP: one per full quarter of max HP lost. */
export function hareStep(hp: number, maxHp: number): number {
  if (maxHp > 0) {
    if (hp <= maxHp * 0.25) return 3;
    if (hp <= maxHp * 0.5) return 2;
    if (hp <= maxHp * 0.75) return 1;
  }
  return 0;
}

/** Chase speed (world units/second) of the Hare at the given HP. Steps up at ≤75%, ≤50%, ≤25% of max HP. */
export function hareSpeed(hp: number, maxHp: number): number {
  return HARE_STEPS[hareStep(hp, maxHp)];
}
