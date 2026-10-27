import { describe, expect, it } from 'vitest';
import { polygonPoints, shapePoints, starPoints } from '../../src/art/shapes';
import type { ShapeKind } from '../../src/content/types';

type Point = { x: number; y: number };

/** shapePoints guard: every kind except circle must return an outline. */
function outline(kind: ShapeKind, points?: number): Point[] {
  const pts = shapePoints(kind, 0, 0, 10, points);
  if (pts === null) throw new Error(`expected an outline for ${kind}`);
  return pts;
}

describe('shape geometry', () => {
  it('polygonPoints(0, 0, 10, 4) starts at (10, 0) and walks the corners', () => {
    const pts = polygonPoints(0, 0, 10, 4);
    expect(pts).toHaveLength(4);
    const expected: Point[] = [
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: -10, y: 0 },
      { x: 0, y: -10 },
    ];
    for (let i = 0; i < pts.length; i++) {
      expect(pts[i].x).toBeCloseTo(expected[i].x);
      expect(pts[i].y).toBeCloseTo(expected[i].y);
    }
  });

  it('every polygon point sits at distance r from the centre', () => {
    for (let sides = 3; sides <= 8; sides++) {
      for (const p of polygonPoints(3, -2, 7, sides)) {
        expect(Math.hypot(p.x - 3, p.y + 2)).toBeCloseTo(7);
      }
    }
  });

  it('a 90 degree rotation moves the first corner to the top', () => {
    const first = polygonPoints(5, 5, 2, 3, Math.PI / 2)[0];
    expect(first.x).toBeCloseTo(5);
    expect(first.y).toBeCloseTo(7);
  });

  it('starPoints(0, 0, 10, 4, 5) starts at (10, 0) and alternates tips at 10 and valleys at 4', () => {
    const pts = starPoints(0, 0, 10, 4, 5);
    expect(pts).toHaveLength(10);
    expect(pts[0].x).toBeCloseTo(10);
    expect(pts[0].y).toBeCloseTo(0);
    for (let i = 0; i < pts.length; i++) {
      const r = i % 2 === 0 ? 10 : 4;
      expect(Math.hypot(pts[i].x, pts[i].y)).toBeCloseTo(r);
    }
  });

  it('shapePoints returns null for circle', () => {
    expect(shapePoints('circle', 0, 0, 10)).toBeNull();
  });

  it('triangle, pentagon and hexagon are regular polygons starting at (10, 0)', () => {
    const kinds: [ShapeKind, number][] = [
      ['triangle', 3],
      ['pentagon', 5],
      ['hexagon', 6],
    ];
    for (const [kind, sides] of kinds) {
      const pts = outline(kind);
      expect(pts).toHaveLength(sides);
      expect(pts[0].x).toBeCloseTo(10);
      expect(pts[0].y).toBeCloseTo(0);
    }
  });

  it('diamond is the unrotated 4-gon', () => {
    const pts = outline('diamond');
    expect(pts).toHaveLength(4);
    const expected: Point[] = [
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: -10, y: 0 },
      { x: 0, y: -10 },
    ];
    for (let i = 0; i < pts.length; i++) {
      expect(pts[i].x).toBeCloseTo(expected[i].x);
      expect(pts[i].y).toBeCloseTo(expected[i].y);
    }
  });

  it('square corners sit at 10 / sqrt(2) on both axes', () => {
    const pts = outline('square');
    expect(pts).toHaveLength(4);
    for (const p of pts) {
      expect(Math.abs(p.x)).toBeCloseTo(10 / Math.SQRT2);
      expect(Math.abs(p.y)).toBeCloseTo(10 / Math.SQRT2);
    }
  });

  it('rect is a 2:1 block, wider than tall', () => {
    expect(shapePoints('rect', 0, 0, 10)).toEqual([
      { x: -10, y: -5 },
      { x: 10, y: -5 },
      { x: 10, y: 5 },
      { x: -10, y: 5 },
    ]);
  });

  it('star defaults to 5 tips (10 points, inner radius 5) and 8 points with points = 4', () => {
    const pts = outline('star');
    expect(pts).toHaveLength(10);
    for (let i = 0; i < pts.length; i++) {
      const r = i % 2 === 0 ? 10 : 5;
      expect(Math.hypot(pts[i].x, pts[i].y)).toBeCloseTo(r);
    }
    expect(outline('star', 4)).toHaveLength(8);
  });
});
