/**
 * Canvas 2D painting helpers: the game's look comes from these. Rounded shapes, a darker side
 * face for thickness, soft shadows. Textures are painted once (art/textures.ts) and drawn as images.
 */
import { PALETTE, rgba } from '../content/palette';
import type { Shape } from '../content/types';
import { shapePoints } from './shapes';

/** Soft shadow under raised things. */
export const SHADOW = { color: rgba(PALETTE.ink, 0.22), blur: 10, offsetY: 4 } as const;

/**
 * Turns on the soft shadow for the next fill. Canvas shadows ignore the transform, so they are
 * scaled by it here: textures are painted at 2x (see ART in textures.ts) and look the same.
 */
export function setShadow(ctx: CanvasRenderingContext2D, strength = 1): void {
  const k = ctx.getTransform().a;
  ctx.shadowColor = rgba(PALETTE.ink, 0.22 * strength);
  ctx.shadowBlur = SHADOW.blur * k * strength;
  ctx.shadowOffsetY = SHADOW.offsetY * k * strength;
}

/** Traces a rounded polygon (corner radius `round`, clamped to fit). */
export function roundedPolygon(ctx: CanvasRenderingContext2D, pts: readonly { x: number; y: number }[], round: number): void {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]!;
    const cur = pts[i]!;
    const next = pts[(i + 1) % n]!;
    const r = Math.min(round, Math.hypot(cur.x - prev.x, cur.y - prev.y) / 2, Math.hypot(next.x - cur.x, next.y - cur.y) / 2);
    const startX = cur.x + ((prev.x - cur.x) / Math.hypot(prev.x - cur.x, prev.y - cur.y)) * r;
    const startY = cur.y + ((prev.y - cur.y) / Math.hypot(prev.x - cur.x, prev.y - cur.y)) * r;
    if (i === 0) ctx.moveTo(startX, startY);
    else ctx.lineTo(startX, startY);
    ctx.arcTo(cur.x, cur.y, next.x, next.y, r);
  }
  ctx.closePath();
}

/** Traces a shape of `radius` centered on (x, y), with rounded corners. */
export function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, radius: number): void {
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    return;
  }
  const pts = shapePoints(shape, radius).map((p) => ({ x: p.x + x, y: p.y + y }));
  roundedPolygon(ctx, pts, radius * 0.28);
}

/** Traces a rounded rectangle. */
export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export interface TokenOptions {
  /** Height of the darker side face, in pixels (0 for a flat shape). */
  depth?: number;
  /** Soft shadow under it. */
  shadow?: boolean;
}

/**
 * A chunky token: the shape in `deep` shifted down by `depth` (its side face, with a soft shadow),
 * then the shape in `fill` on top. Everything in the game that stands on the board is drawn so.
 */
export function paintToken(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, radius: number, fill: number, deep: number, opts: TokenOptions = {}): void {
  const depth = opts.depth ?? Math.max(2, radius * 0.18);
  ctx.save();
  if (opts.shadow !== false) setShadow(ctx);
  shapePath(ctx, shape, x, y + depth, radius);
  ctx.fillStyle = rgba(deep, 1);
  ctx.fill();
  ctx.restore();
  shapePath(ctx, shape, x, y, radius);
  ctx.fillStyle = rgba(fill, 1);
  ctx.fill();
}
