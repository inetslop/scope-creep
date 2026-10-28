import type { Shape } from '../content/types';

/** Corner points of a regular shape of `radius` around (0, 0), pointing up. Empty for a circle. */
export function shapePoints(shape: Shape, radius: number): { x: number; y: number }[] {
  const sides: Record<Shape, number> = { circle: 0, triangle: 3, square: 4, diamond: 4, pentagon: 5, hexagon: 6 };
  const n = sides[shape];
  if (n === 0) return [];
  // Squares sit flat; diamonds are squares on a corner; odd shapes point up.
  const start = shape === 'square' ? -Math.PI / 4 : -Math.PI / 2;
  // Triangles look smaller than their radius suggests: give them a little more.
  const r = shape === 'square' ? radius * 1.2 : shape === 'triangle' ? radius * 1.2 : radius;
  // Triangles sit a little low so they look centered.
  const dy = shape === 'triangle' ? radius * 0.15 : 0;
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r + dy };
  });
}
