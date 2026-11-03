/**
 * The marks a tower's barrel wears for its first augment (the Patterns toggle): one small
 * muted-ink shape per first augment, drawn on the barrel face (entities/Tower.ts shows it).
 * All 16 are distinct; the shape is the information, so every mark is the same color, and no
 * mark copies its own barrel's silhouette (a short vertical rod).
 */
import { PALETTE, rgba } from '../content/palette';
import { roundRectPath, shapePath } from './paint';

/** The mark's silhouette. Flat (no shading), so it may ride the turning barrel. */
export type BarrelMarkShape =
  | 'bar'
  | 'dot'
  | 'chevron'
  | 'x'
  | 'two-bars'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'ring'
  | 'arc'
  | 'cross'
  | 'crescent'
  | 'two-dots'
  | 'zigzag'
  | 'hollow-square'
  | 'bar-and-dot';

/** One mark per first augment, keyed by augment id. All 16 first augments, all distinct. */
export const BARREL_MARKS: Record<string, BarrelMarkShape> = {
  bolt: 'bar',
  lance: 'x',
  splash: 'two-bars',
  spray: 'crescent',
  push: 'chevron',
  anchor: 'ring',
  mint: 'dot',
  toll: 'bar-and-dot',
  rally: 'two-dots',
  haste: 'zigzag',
  mark: 'cross',
  feast: 'hollow-square',
  ember: 'triangle',
  beam: 'arc',
  rapid: 'square',
  reach: 'diamond',
};

/**
 * The mark of `firstId`, centered at (cx, cy) in fractions of the barrel's reference radius r
 * (the tower body's radius, TOWER_BODY * CELL). It is a flat muted-ink shape: no side face,
 * no shadow, so the barrel may turn under it.
 */
export function paintBarrelMark(ctx: CanvasRenderingContext2D, firstId: string, cx: number, cy: number, r: number): void {
  const shape = BARREL_MARKS[firstId];
  if (shape === undefined) return;
  paintBarrelMarkShape(ctx, shape, cx, cy, r);
}

function paintBarrelMarkShape(ctx: CanvasRenderingContext2D, shape: BarrelMarkShape, cx: number, cy: number, r: number): void {
  const ink = rgba(PALETTE.muted, 1);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  switch (shape) {
    case 'bar': // a short horizontal bar
      roundRectPath(ctx, cx - 0.14 * r, cy - 0.07 * r, 0.28 * r, 0.14 * r, 0.07 * r);
      ctx.fill();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(cx, cy, 0.1 * r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'chevron':
      shapePath(ctx, 'chevron', cx, cy, 0.16 * r);
      ctx.fill();
      break;
    case 'x': // a bar, twice, crossed (the dot's bar, not the barrel's)
      for (const a of [Math.PI / 4, -Math.PI / 4]) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        roundRectPath(ctx, -0.14 * r, -0.07 * r, 0.28 * r, 0.14 * r, 0.07 * r);
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'two-bars': // two stacked bars
      roundRectPath(ctx, cx - 0.13 * r, cy - 0.11 * r, 0.26 * r, 0.07 * r, 0.035 * r);
      ctx.fill();
      roundRectPath(ctx, cx - 0.13 * r, cy + 0.04 * r, 0.26 * r, 0.07 * r, 0.035 * r);
      ctx.fill();
      break;
    case 'triangle':
      shapePath(ctx, 'triangle', cx, cy, 0.16 * r);
      ctx.fill();
      break;
    case 'square':
      shapePath(ctx, 'square', cx, cy, 0.15 * r);
      ctx.fill();
      break;
    case 'diamond':
      shapePath(ctx, 'diamond', cx, cy, 0.15 * r);
      ctx.fill();
      break;
    case 'ring': // small, centered: clear of the barrel edge
      ctx.lineWidth = 0.08 * r;
      ctx.beginPath();
      ctx.arc(cx, cy, 0.12 * r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'arc': // the top half of the ring
      ctx.lineWidth = 0.08 * r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, 0.12 * r, Math.PI, 2 * Math.PI);
      ctx.stroke();
      break;
    case 'cross': // a bar, upright and flat, crossed
      roundRectPath(ctx, cx - 0.06 * r, cy - 0.14 * r, 0.12 * r, 0.28 * r, 0.06 * r);
      ctx.fill();
      roundRectPath(ctx, cx - 0.14 * r, cy - 0.06 * r, 0.28 * r, 0.12 * r, 0.06 * r);
      ctx.fill();
      break;
    case 'crescent': // the ring with most of it lit out, to one side
      {
        const R = 0.16 * r;
        const Ri = 0.12 * r;
        const dx = 0.06 * r;
        const d = (R * R - Ri * Ri + dx * dx) / (2 * dx);
        const h = Math.sqrt(R * R - d * d);
        const a1 = Math.atan2(h, d);
        const a2 = Math.atan2(h, d - dx);
        ctx.beginPath();
        ctx.arc(cx, cy, R, a1, Math.PI * 2 - a1, false);
        ctx.arc(cx + dx, cy, Ri, a2, Math.PI * 2 - a2, false);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'two-dots':
      ctx.beginPath();
      ctx.arc(cx - 0.07 * r, cy, 0.06 * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 0.07 * r, cy, 0.06 * r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'zigzag':
      ctx.lineWidth = 0.07 * r;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 0.12 * r, cy - 0.05 * r);
      ctx.lineTo(cx - 0.04 * r, cy + 0.05 * r);
      ctx.lineTo(cx + 0.04 * r, cy - 0.05 * r);
      ctx.lineTo(cx + 0.12 * r, cy + 0.05 * r);
      ctx.stroke();
      break;
    case 'hollow-square':
      ctx.lineWidth = 0.06 * r;
      roundRectPath(ctx, cx - 0.11 * r, cy - 0.11 * r, 0.22 * r, 0.22 * r, 0.05 * r);
      ctx.stroke();
      break;
    case 'bar-and-dot': // a bar with a dot under it
      roundRectPath(ctx, cx - 0.14 * r, cy - 0.09 * r, 0.28 * r, 0.08 * r, 0.04 * r);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 0.1 * r, 0.05 * r, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}
