/**
 * Capsule hit test for long-bar enemies (pure logic): a bar hit-tests as a
 * capsule along its long axis — a segment of the bar's full length centered at
 * (cx, cy), rotated by angleRad, with end caps of radius halfThickness. A
 * point is inside when it is within halfThickness of the segment. See
 * tests/core/barHit.test.ts.
 */
export function barContains(cx: number, cy: number, angleRad: number, halfLength: number, halfThickness: number, px: number, py: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  // Rotate the point into the bar's frame, where the long axis is +X.
  const cos = Math.cos(-angleRad);
  const sin = Math.sin(-angleRad);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  // Closest point on the axis segment, then the distance to it (capsule test).
  const clamped = Math.max(-halfLength, Math.min(halfLength, lx));
  const ex = lx - clamped;
  return ex * ex + ly * ly <= halfThickness * halfThickness;
}
