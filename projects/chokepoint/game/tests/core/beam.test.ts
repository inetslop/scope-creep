import { describe, expect, it } from 'vitest';
import { beamLines, inBeamRange } from '../../src/core/beam';
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
    const { main, lines } = beamLines([], [a, b, c], 0, 0, R, true);
    expect([a, b, c][main]).toBe(b);
    expect(lines).toEqual([]);
  });

  it('the main line is sticky: it holds its target even when another enemy overtakes it', () => {
    const a = e(2, 0, 30);
    const b = e(-2, 0, 25);
    expect(beamLines([], [a, b], 0, 0, R, true).main).toBe(0); // a is furthest
    b.distance = 40; // b overtakes a
    expect(beamLines([a], [a, b], 0, 0, R, true).main).toBe(0); // the line still holds a
  });

  it('the main line re-takes the new furthest when its target dies', () => {
    const a = e(2, 0, 40);
    const b = e(-2, 0, 30);
    expect(beamLines([], [a, b], 0, 0, R, true).main).toBe(0);
    a.active = false;
    expect(beamLines([a], [a, b], 0, 0, R, true).main).toBe(1);
  });

  it('the main line re-takes when its target leaves range', () => {
    const a = e(2, 0, 40);
    const b = e(-2, 0, 30);
    expect(beamLines([], [a, b], 0, 0, R, true).main).toBe(0);
    a.x = 20; // a leaves range
    const out = beamLines([a], [a, b], 0, 0, R, true);
    expect([a, b][out.main]).toBe(b);
  });

  it('a Beam added to another tower always follows the furthest enemy', () => {
    const a = e(2, 0, 30);
    const b = e(-2, 0, 20);
    expect(beamLines([], [a, b], 0, 0, R, false).main).toBe(0);
    b.distance = 40;
    expect(beamLines([a], [a, b], 0, 0, R, false).main).toBe(1);
  });

  it('the second line takes the enemy nearest the main target, not the next furthest', () => {
    const main = e(2, 0, 50);
    const near = e(3, 0, 10);
    const far = e(-2, 0, 40); // further along than `near`, but farther from the main target
    const { main: m, lines } = beamLines([undefined, undefined], [main, near, far], 0, 0, R, true);
    expect(m).toBe(0);
    expect(lines).toEqual([near]);
  });

  it('two extra lines take the two nearest to the main target, in order', () => {
    const main = e(0, 0, 50);
    const n1 = e(1, 0, 10);
    const n2 = e(2, 0, 20);
    const n3 = e(3, 0, 30);
    const { main: m, lines } = beamLines([undefined, undefined, undefined], [main, n1, n2, n3], 0, 0, R, true);
    expect(m).toBe(0);
    expect(lines).toEqual([n1, n2]);
  });

  it('extra lines drop when the main target changes, even with their own target alive, and retake around the new one', () => {
    const a = e(2, 0, 50);
    const b = e(-2, 0, 40);
    const c = e(4, 0, 30);
    const d = e(-4, 0, 10);
    const first = beamLines([undefined, undefined], [a, b, c, d], 0, 0, R, true);
    expect([a, b, c, d][first.main]).toBe(a);
    expect(first.lines[0]).toBe(c); // nearest to a
    a.active = false; // the main dies: b takes over, and the line drops c (still alive) for d
    const second = beamLines([a, c], [a, b, c, d], 0, 0, R, true);
    expect([a, b, c, d][second.main]).toBe(b);
    expect(second.lines[0]).toBe(d);
  });

  it('a Beam added to another tower retakes its line whenever the furthest enemy changes', () => {
    const a = e(2, 0, 50);
    const b = e(-2, 0, 40);
    const c = e(4, 0, 30);
    const first = beamLines([undefined, undefined], [a, b, c], 0, 0, R, false);
    expect([a, b, c][first.main]).toBe(a);
    expect(first.lines[0]).toBe(c); // nearest to a
    b.distance = 60; // b becomes furthest: the line drops c for a
    const second = beamLines([a, c], [a, b, c], 0, 0, R, false);
    expect([a, b, c][second.main]).toBe(b);
    expect(second.lines[0]).toBe(a);
  });

  it('each extra line retargets independently when its own target dies', () => {
    const main = e(0, 0, 50);
    const l1 = e(1, 0, 20);
    const l2 = e(2, 0, 15);
    const free = e(3, 0, 10);
    const first = beamLines([undefined, undefined, undefined], [main, l1, l2, free], 0, 0, R, true);
    expect(first.lines).toEqual([l1, l2]);
    l1.active = false;
    const second = beamLines([main, l1, l2], [main, l1, l2, free], 0, 0, R, true);
    expect(second.lines[0]).toBe(l2); // line 1 retakes first: l2 is the nearest free to the main
    expect(second.lines[1]).toBe(free); // line 2's target is gone: it retakes too, never a mate's target
  });

  it('a line never takes the main target or a mate\'s target', () => {
    const main = e(0, 0, 50);
    const only = e(1, 0, 20);
    const { lines } = beamLines([undefined, undefined, undefined], [main, only], 0, 0, R, true);
    expect(lines[0]).toBe(only);
    expect(lines[1]).toBeUndefined();
  });

  it('while the main line holds, the extra lines hold their own targets', () => {
    const main = e(2, 0, 50);
    const line = e(3, 0, 20);
    const first = beamLines([undefined, undefined], [main, line], 0, 0, R, true);
    expect(first.main).toBe(0);
    expect(first.lines[0]).toBe(line);
    const over = e(1, 0, 60); // overtakes the main, which still holds
    const second = beamLines([main, line], [main, line, over], 0, 0, R, true);
    expect(second.main).toBe(0);
    expect(second.lines[0]).toBe(line);
  });

  it('nothing in range: no main, no lines', () => {
    const far = e(50, 0, 90);
    const { main, lines } = beamLines([undefined, undefined, undefined], [far], 0, 0, R, true);
    expect(main).toBe(-1);
    expect(lines).toEqual([undefined, undefined]);
  });
});
