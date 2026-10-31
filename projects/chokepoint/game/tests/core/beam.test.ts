import { describe, expect, it } from 'vitest';
import { beamLines, inBeamRange, rayTargets } from '../../src/core/beam';
import type { TargetCandidate } from '../../src/core/targeting';

const e = (x: number, y: number, distance: number, active = true): TargetCandidate => ({ x, y, distance, active });
const R = 10; // the tower sits at (0, 0)

describe('inBeamRange', () => {
  it('is true in range (boundary included), false out of range or inactive', () => {
    expect(inBeamRange(e(3, 4, 0), 0, 0, R)).toBe(true);
    expect(inBeamRange(e(8, 6, 0), 0, 0, R)).toBe(true);
    expect(inBeamRange(e(8, 7, 0), 0, 0, R)).toBe(false);
    expect(inBeamRange(e(1, 1, 0, false), 0, 0, R)).toBe(false);
  });
});

describe('beamLines', () => {
  it('the main line locks the furthest enemy in range', () => {
    const a = e(2, 0, 30);
    const b = e(-2, 0, 40);
    const c = e(5, 0, 10);
    expect([a, b, c][beamLines(undefined, [a, b, c], 0, 0, R, true)]).toBe(b);
  });

  it('the main line is sticky: it holds its target even when another enemy overtakes it', () => {
    const a = e(2, 0, 30);
    const b = e(-2, 0, 25);
    expect(beamLines(undefined, [a, b], 0, 0, R, true)).toBe(0); // a is furthest
    b.distance = 40; // b overtakes a
    expect(beamLines(a, [a, b], 0, 0, R, true)).toBe(0); // the line still holds a
  });

  it('the main line re-takes the new furthest when its target dies', () => {
    const a = e(2, 0, 40);
    const b = e(-2, 0, 30);
    expect(beamLines(undefined, [a, b], 0, 0, R, true)).toBe(0);
    a.active = false;
    expect(beamLines(a, [a, b], 0, 0, R, true)).toBe(1);
  });

  it('the main line re-takes when its target leaves range', () => {
    const a = e(2, 0, 40);
    const b = e(-2, 0, 30);
    expect(beamLines(undefined, [a, b], 0, 0, R, true)).toBe(0);
    a.x = 20; // a leaves range
    expect([a, b][beamLines(a, [a, b], 0, 0, R, true)]).toBe(b);
  });

  it('a non-sticky main line always follows the furthest enemy', () => {
    const a = e(2, 0, 30);
    const b = e(-2, 0, 20);
    expect(beamLines(undefined, [a, b], 0, 0, R, false)).toBe(0);
    b.distance = 40;
    expect(beamLines(a, [a, b], 0, 0, R, false)).toBe(1);
  });

  it('nothing in range: no line', () => {
    const far = e(50, 0, 90);
    expect(beamLines(undefined, [far], 0, 0, R, true)).toBe(-1);
  });
});

describe('rayTargets', () => {
  it('takes the enemies furthest along in range, after the main target', () => {
    const main = e(0, 0, 50);
    const second = e(1, 0, 40);
    const third = e(2, 0, 30);
    const near = e(3, 0, 10);
    expect(rayTargets([main, second, third, near], 0, 0, R, main, 2)).toEqual([second, third]);
  });

  it('never takes the main target, and back-fills the ray behind it', () => {
    const main = e(0, 0, 50);
    const second = e(1, 0, 40);
    const third = e(2, 0, 30);
    expect(rayTargets([main, second, third], 0, 0, R, main, 2)).toEqual([second, third]);
    expect(rayTargets([main, second], 0, 0, R, main, 1)).toEqual([second]);
  });

  it('is stateless: it re-derives the rays from the live enemies, with no memory between calls', () => {
    const main = e(0, 0, 50);
    const second = e(1, 0, 40);
    const third = e(2, 0, 30);
    expect(rayTargets([main, second, third], 0, 0, R, main, 1)).toEqual([second]);
    second.active = false; // its target dies: the ray retakes the next furthest at once
    expect(rayTargets([main, second, third], 0, 0, R, main, 1)).toEqual([third]);
  });

  it('skips inactive and out-of-range enemies', () => {
    const main = e(0, 0, 50);
    const dead = e(1, 0, 40, false);
    const far = e(60, 0, 30);
    const free = e(2, 0, 20);
    expect(rayTargets([main, dead, far, free], 0, 0, R, main, 2)).toEqual([free]);
  });

  it('returns a short list when fewer enemies than rays are in range', () => {
    const main = e(0, 0, 50);
    expect(rayTargets([main], 0, 0, R, main, 2)).toEqual([]);
    const only = e(1, 0, 40);
    expect(rayTargets([main, only], 0, 0, R, main, 2)).toEqual([only]);
  });
});
