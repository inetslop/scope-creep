import type Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { ShapeKind } from '../content/types';

type Graphics = Phaser.GameObjects.Graphics;
interface Point {
  x: number;
  y: number;
}

/** Regular polygon. `rotation` 0 puts the first corner on the right. */
export function polygonPoints(cx: number, cy: number, r: number, sides: number, rotation = 0): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i / sides) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

/** Star with `points` tips; the first tip points right. */
export function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): Point[] {
  const step = Math.PI / points;
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR;
    return { x: cx + Math.cos(i * step) * r, y: cy + Math.sin(i * step) * r };
  });
}

/** Outline points for a shape kind (circles return null: draw them with fillCircle). */
export function shapePoints(kind: ShapeKind, cx: number, cy: number, r: number, points = 5): Point[] | null {
  switch (kind) {
    case 'circle':
      return null;
    case 'triangle':
      return polygonPoints(cx, cy, r, 3, 0);
    case 'square':
      return polygonPoints(cx, cy, r, 4, Math.PI / 4);
    case 'diamond':
      return polygonPoints(cx, cy, r, 4, 0);
    case 'pentagon':
      return polygonPoints(cx, cy, r, 5, 0);
    case 'hexagon':
      return polygonPoints(cx, cy, r, 6, 0);
    case 'star':
      return starPoints(cx, cy, r, r * 0.5, points);
  }
}

function fill(g: Graphics, kind: ShapeKind, cx: number, cy: number, r: number, points?: number): void {
  const pts = shapePoints(kind, cx, cy, r, points);
  if (pts) g.fillPoints(pts, true);
  else g.fillCircle(cx, cy, r);
}

function stroke(g: Graphics, kind: ShapeKind, cx: number, cy: number, r: number, points?: number): void {
  const pts = shapePoints(kind, cx, cy, r, points);
  if (pts) g.strokePoints(pts, true, true);
  else g.strokeCircle(cx, cy, r);
}

export interface ShapeStyle {
  /** Outline color (default ink). */
  outline?: number;
  /** Outline width (default scales with size). 0 = no outline. */
  outlineWidth?: number;
  /** Draw the offset paper-cut shadow (default true). */
  shadow?: boolean;
  /** Tips for stars. */
  points?: number;
}

/** Shadow offset in pixels for the paper-cut look. Textures need this much padding. */
export const SHADOW_OFFSET = 3;

/** The house style: flat fill, ink outline, hard offset shadow. No gradients, no glow. */
export function drawShape(g: Graphics, kind: ShapeKind, cx: number, cy: number, r: number, color: number, style: ShapeStyle = {}): void {
  const width = style.outlineWidth ?? Math.max(2, Math.round(r * 0.14));
  if (style.shadow !== false) {
    g.fillStyle(PALETTE.ink, 0.18);
    fill(g, kind, cx + SHADOW_OFFSET, cy + SHADOW_OFFSET, r, style.points);
  }
  g.fillStyle(color, 1);
  fill(g, kind, cx, cy, r, style.points);
  if (width > 0) {
    g.lineStyle(width, style.outline ?? PALETTE.ink, 1);
    stroke(g, kind, cx, cy, r - width / 2, style.points);
  }
}
