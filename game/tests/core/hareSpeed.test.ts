import { describe, expect, it } from 'vitest';
import { HARE_STEPS, hareSpeed } from '../../src/core/hareSpeed';

describe('hareSpeed', () => {
  it('pins the four speed steps to 40 / 52 / 67.6 / 87.9', () => {
    expect(HARE_STEPS).toEqual([40, 52, 67.6, 87.9]);
  });

  it.each([
    [24, 40], // full HP: sluggish
    [21, 40],
    [20, 40],
    [19, 40], // still above 75% (18/24)
    [18, 52], // exactly 75%: first step up
    [17, 52],
    [15, 52],
    [13, 52], // still above 50% (12/24)
    [12, 67.6], // exactly 50%: second step up
    [10, 67.6],
    [8, 67.6],
    [7, 67.6], // still above 25% (6/24)
    [6, 87.9], // exactly 25%: top speed reached
    [3, 87.9],
    [1, 87.9], // last gasp at 1 hp
    [0, 87.9],
  ] as const)('with maxHp 24, %i hp chases at %i u/s', (hp, speed) => {
    expect(hareSpeed(hp, 24)).toBe(speed);
  });

  it('steps scale with max HP (elite Hare)', () => {
    expect(hareSpeed(48, 48)).toBe(40);
    expect(hareSpeed(36, 48)).toBe(52); // ≤75%
    expect(hareSpeed(24, 48)).toBe(67.6); // ≤50%
    expect(hareSpeed(12, 48)).toBe(87.9); // ≤25%
  });

  it('never returns NaN (even with maxHp 0)', () => {
    expect(HARE_STEPS).toContain(hareSpeed(5, 0));
  });
});
