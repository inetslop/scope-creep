/**
 * The marks a boss token wears for its id (the Patterns toggle): one small muted-ink shape per
 * boss the wave plans declare, drawn on the token face (entities/Enemy.ts shows it); the split
 * children wear their parent's mark at 60%. All are distinct from each other, from every regular
 * enemy's mark (art/entities.ts) and from every barrel mark (art/barrelMarks.ts): one shape means
 * one thing, and no mark copies its own token's silhouette.
 */
import { PALETTE, rgba } from '../content/palette';
import { roundRectPath, shapePath } from './paint';

/** The mark's silhouette. Flat (no shading), so it may ride the turning tokens (the crosser, the Blinker). */
export type BossMarkShape =
  | 'pentagon'
  | 'ring-dot'
  | 'two-triangles'
  | 'three-bars'
  | 'two-chevrons'
  | 'star'
  | 'arc-pair'
  | 'hollow-diamond'
  | 'hexagon'
  | 'hollow-triangle';

/** One mark per boss the wave plans declare, keyed by boss id. All distinct. */
export const BOSS_MARKS: Record<string, BossMarkShape> = {
  colossus: 'pentagon',
  titan: 'ring-dot',
  orb: 'two-triangles',
  hive: 'three-bars',
  crosser: 'two-chevrons',
  blinker: 'star',
  mender: 'arc-pair',
  leech: 'hollow-diamond',
  gorge: 'hexagon',
};

/**
 * The mark of `bossId`, centered at (cx, cy) in fractions of the token radius r (a split child's
 * miniature passes 0.6 * the parent's radius). It is a flat muted-ink shape: no side face, no
 * shadow, so the token may turn under it.
 */
export function paintBossMark(ctx: CanvasRenderingContext2D, bossId: string, cx: number, cy: number, r: number): void {
  const shape = BOSS_MARKS[bossId];
  if (shape === undefined) return;
  paintBossMarkShape(ctx, shape, cx, cy, r);
}

function paintBossMarkShape(ctx: CanvasRenderingContext2D, shape: BossMarkShape, cx: number, cy: number, r: number): void {
  const ink = rgba(PALETTE.muted, 1);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  switch (shape) {
    case 'pentagon':
      shapePath(ctx, 'pentagon', cx, cy, 0.3 * r);
      ctx.fill();
      break;
    case 'hexagon': // solid: it reads on the Gorge's busy spiral face, where a stroked shape would not
      shapePath(ctx, 'hexagon', cx, cy, 0.26 * r);
      ctx.fill();
      break;
    case 'star': // one path, 10 vertices, the even ones reaching further
      {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? 0.3 * r : 0.12 * r;
          const x = cx + rad * Math.cos(a);
          const y = cy + rad * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'ring-dot': // a ring with a dot in it
      ctx.lineWidth = 0.07 * r;
      ctx.beginPath();
      ctx.arc(cx, cy, 0.2 * r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 0.09 * r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'two-triangles': // two triangles pointing at each other
      ctx.beginPath();
      ctx.moveTo(cx - 0.3 * r, cy - 0.16 * r);
      ctx.lineTo(cx - 0.3 * r, cy + 0.16 * r);
      ctx.lineTo(cx - 0.08 * r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 0.3 * r, cy - 0.16 * r);
      ctx.lineTo(cx + 0.3 * r, cy + 0.16 * r);
      ctx.lineTo(cx + 0.08 * r, cy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'three-bars': // three stacked bars
      for (const off of [-0.14, 0, 0.14]) {
        roundRectPath(ctx, cx - 0.15 * r, cy + off * r - 0.04 * r, 0.3 * r, 0.08 * r, 0.04 * r);
        ctx.fill();
      }
      break;
    case 'two-chevrons': // two chevrons, one above the other
      shapePath(ctx, 'chevron', cx, cy - 0.17 * r, 0.14 * r);
      ctx.fill();
      shapePath(ctx, 'chevron', cx, cy + 0.17 * r, 0.14 * r);
      ctx.fill();
      break;
    case 'arc-pair': // two arcs facing each other (a closing ring, split)
      ctx.lineWidth = 0.07 * r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, 0.18 * r, Math.PI * 0.75, Math.PI * 1.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 0.18 * r, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.stroke();
      break;
    case 'hollow-diamond':
      ctx.lineWidth = 0.06 * r;
      shapePath(ctx, 'diamond', cx, cy, 0.22 * r);
      ctx.stroke();
      break;
    case 'hollow-triangle': // reserved for the next boss (the Fracture); no record entry yet
      ctx.lineWidth = 0.06 * r;
      shapePath(ctx, 'triangle', cx, cy, 0.24 * r);
      ctx.stroke();
      break;
  }
}
