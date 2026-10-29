import { describe, expect, it } from 'vitest';
import { plateMul } from '../../src/core/plate';

describe('plate', () => {
  it('halves a shot that flies against the travel into the front', () => {
    expect(plateMul(0.5, 0, 1, 0, -1)).toBe(0.5); // a shot flying down at an enemy walking up: head-on into the face
    expect(plateMul(0.5, 1, 0, -1, 0)).toBe(0.5); // head-on, the other axis
  });

  it('goes whole into the rear (flying in the travel direction)', () => {
    expect(plateMul(0.5, 0, 1, 0, 1)).toBe(1);
    expect(plateMul(0.5, 1, 0, 1, 0)).toBe(1);
  });

  it('goes whole exactly perpendicular to the travel', () => {
    expect(plateMul(0.5, 1, 0, 0, 1)).toBe(1);
    expect(plateMul(0.5, 0, 1, 1, 0)).toBe(1);
  });

  it('goes whole for a diagonal that does not fly into the face', () => {
    expect(plateMul(0.5, Math.SQRT1_2, Math.SQRT1_2, 0, 1)).toBe(1); // 45° off the travel: not head-on
    expect(plateMul(0.5, Math.SQRT1_2, -Math.SQRT1_2, 0, 1)).toBe(0.5); // 45° into the face still counts
  });

  it('takes any plate value, not only a half', () => {
    expect(plateMul(0.3, 0, 1, 0, -1)).toBe(0.3);
    expect(plateMul(0.75, 0, 1, 0, -1)).toBe(0.75);
  });
});

describe('plateMul', () => {
  it('halves a shot that flies into the face, from either side of the road', () => {
    // The enemy walks right; a shot flying left at it strikes the plate (and vice versa).
    expect(plateMul(0.5, -1, 0, 1, 0)).toBe(0.5);
    expect(plateMul(0.5, 1, 0, -1, 0)).toBe(0.5);
  });
  it('lets a shot that strikes the rear go whole', () => {
    // The enemy walks right; a chasing shot flying right hits the back.
    expect(plateMul(0.5, 1, 0, 1, 0)).toBe(1);
  });
  it('lets a dead-side (perpendicular) shot go whole', () => {
    // Exactly perpendicular counts as the rear.
    expect(plateMul(0.5, 0, 1, 1, 0)).toBe(1);
  });
});
