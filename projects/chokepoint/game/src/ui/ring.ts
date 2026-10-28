import type Phaser from 'phaser';

/**
 * Fills a ring, or an arc of one, as a single polygon with rounded ends. Use it instead of a thick
 * stroke: WebGL builds thick strokes from separate segments, which look notched and shimmer while
 * the arc animates; a filled shape at a fixed angle step stays smooth and steady.
 * Angles in radians, 0 = up, clockwise; from 0 to 2π is a full ring.
 */
export function fillRing(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, thickness: number, from: number, to: number, color: number, alpha = 1): void {
  const span = Math.max(0, Math.min(Math.PI * 2, to - from));
  if (span <= 0) return;
  const full = span >= Math.PI * 2 - 1e-6;
  const outer = radius + thickness / 2;
  const inner = radius - thickness / 2;
  const steps = Math.max(8, Math.ceil(span / (Math.PI / 90)));
  const at = (r: number, a: number): Phaser.Types.Math.Vector2Like => ({ x: x + Math.sin(a) * r, y: y - Math.cos(a) * r });
  g.fillStyle(color, alpha);
  if (full) {
    // A full ring: two concentric circles, filled between (as one shape with a hole would need masks).
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i <= steps; i++) pts.push(at(outer, from + (span * i) / steps));
    for (let i = steps; i >= 0; i--) pts.push(at(inner, from + (span * i) / steps));
    g.fillPoints(pts, true);
    return;
  }
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i <= steps; i++) pts.push(at(outer, from + (span * i) / steps));
  for (let i = steps; i >= 0; i--) pts.push(at(inner, from + (span * i) / steps));
  g.fillPoints(pts, true);
  // Rounded ends.
  const a = at(radius, from);
  const b = at(radius, from + span);
  g.fillCircle(a.x, a.y, thickness / 2);
  g.fillCircle(b.x, b.y, thickness / 2);
}
