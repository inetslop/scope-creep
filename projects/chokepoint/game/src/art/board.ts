import type Phaser from 'phaser';
import { CELL } from '../config';
import { PALETTE, rgba } from '../content/palette';
import type { Cove } from '../core/cove';
import type { Cell, GameMap } from '../core/map';
import type { PathLine } from '../core/path';
import { paintToken, roundRectPath, setShadow, shapePath, traceRounded } from './paint';
import { paintTexture } from './textures';
import { cellCenter } from '../core/path';

/** Board units of empty space around the island in the board texture, for its shadow. */
export const BOARD_MARGIN = 40;

/** The board as drawn in the run's texture and in the previews: the island, the grid dots, the rocks, the road, the two gates, and the marked cells' yellow dots. */
function drawBoard(ctx: CanvasRenderingContext2D, map: GameMap, path: PathLine, marked: Cell[]): void {
  const w = map.cols * CELL;
  const h = map.rows * CELL;
  // The island, raised off the ground; the cove (core/cove.ts) scoops its bay into the edge.
  ctx.save();
  setShadow(ctx, 1.6);
  if (map.cove) islePath(ctx, map, map.cove);
  else roundRectPath(ctx, 0, 0, w, h, CELL * 0.32);
  ctx.fillStyle = rgba(PALETTE.island, 1);
  ctx.fill();
  ctx.restore();

  // Grid dots at the inner cell corners.
  ctx.fillStyle = rgba(PALETTE.dot, 1);
  for (let row = 1; row < map.rows; row++) {
    for (let col = 1; col < map.cols; col++) {
      ctx.beginPath();
      ctx.arc(col * CELL, row * CELL, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The marked cells' flat dots: a small yellow dot at each cell's face (a tower on one deals +25%).
  ctx.fillStyle = rgba(PALETTE.yellow, 1);
  for (const m of marked) {
    ctx.beginPath();
    ctx.arc((m.col + 0.5) * CELL, (m.row + 0.5) * CELL, CELL * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rocks: low rounded blocks.
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (map.kinds[row]![col] !== 'rock') continue;
      paintToken(ctx, 'square', (col + 0.5) * CELL, (row + 0.5) * CELL - 3, CELL * 0.3, PALETTE.rock, PALETTE.rockDeep, { depth: 6 });
    }
  }

  // The road: from the entrance edge to the exit edge through every path cell center.
  const pts = path.points;
  const first = pts[0]!;
  const second = pts[1]!;
  const last = pts[pts.length - 1]!;
  const beforeLast = pts[pts.length - 2]!;
  const edgeStart = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  const edgeEnd = { x: (last.x + beforeLast.x) / 2, y: (last.y + beforeLast.y) / 2 };
  const road = [edgeStart, ...pts.slice(1, -1), edgeEnd];
  const trace = (): void => {
    ctx.beginPath();
    road.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  };
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  ctx.save();
  setShadow(ctx, 0.7);
  trace();
  ctx.lineWidth = CELL * 0.58;
  ctx.strokeStyle = rgba(PALETTE.road, 1);
  ctx.stroke();
  // The fork (core/fork.ts): the road's second lane, the road's own stroke from the split cell to the rejoin.
  const fork = map.fork;
  if (fork) {
    const lanes = [cellCenter(map.path[fork.split]!, CELL), ...fork.laneB.map((c) => cellCenter(c, CELL)), cellCenter(map.path[fork.rejoin]!, CELL)];
    ctx.beginPath();
    lanes.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  ctx.restore();

  // Gates: where enemies come in (grey, a white chevron) and the exit you defend (ink, a white ring).
  const dirIn = Math.atan2(second.y - first.y, second.x - first.x);
  const gate = (p: { x: number; y: number }, exit: boolean, dir = dirIn): void => {
    ctx.save();
    setShadow(ctx, 0.8);
    roundRectPath(ctx, p.x - CELL * 0.3, p.y - CELL * 0.3, CELL * 0.6, CELL * 0.6, CELL * 0.16);
    ctx.fillStyle = rgba(exit ? PALETTE.ink : PALETTE.faint, 1);
    ctx.fill();
    ctx.restore();
    if (exit) {
      shapePath(ctx, 'circle', p.x, p.y, CELL * 0.12);
      ctx.lineWidth = CELL * 0.07;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(dir);
      ctx.beginPath();
      ctx.moveTo(-CELL * 0.07, -CELL * 0.12);
      ctx.lineTo(CELL * 0.07, 0);
      ctx.lineTo(-CELL * 0.07, CELL * 0.12);
      ctx.lineWidth = CELL * 0.07;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }
  };
  gate(edgeStart, false);
  gate(edgeEnd, true);
  // The far gate: the road's second entrance (core/farGate.ts), a token on its own straight cell, chevron toward the exit.
  const fg = map.farGate;
  if (fg) {
    const i = map.path.findIndex((c) => c.col === fg.col && c.row === fg.row);
    const p = pts[i + 1]!;
    gate(p, false, Math.atan2(pts[i + 2]!.y - p.y, pts[i + 2]!.x - p.x));
  }
}

/** The island's outline: the rounded rectangle, with the cove's bay scooped into the edge lane of its pocket. */
function islePath(ctx: CanvasRenderingContext2D, map: GameMap, cove: Cove): void {
  const R = CELL * 0.32; // the island's corner radius, as the plain board's
  const D = CELL * 0.45; // the bay's depth: the pocket's three cells keep their centers on the island
  const w = map.cols * CELL, h = map.rows * CELL;
  const c0 = cove.cells[0]!, c2 = cove.cells[2]!;
  let pts: { x: number; y: number }[];
  if (c0.row === 0 && c2.row === 0) {
    const x0 = c0.col * CELL, x1 = (c2.col + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: x0, y: 0 }, { x: x0, y: D }, { x: x1, y: D }, { x: x1, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  } else if (c0.row === map.rows - 1 && c2.row === map.rows - 1) {
    const x0 = c0.col * CELL, x1 = (c2.col + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: x1, y: h }, { x: x1, y: h - D }, { x: x0, y: h - D }, { x: x0, y: h }, { x: 0, y: h }];
  } else if (c0.col === 0 && c2.col === 0) {
    const y0 = c0.row * CELL, y1 = (c2.row + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }, { x: 0, y: y1 }, { x: D, y: y1 }, { x: D, y: y0 }, { x: 0, y: y0 }];
  } else if (c0.col === map.cols - 1 && c2.col === map.cols - 1) {
    const y0 = c0.row * CELL, y1 = (c2.row + 1) * CELL;
    pts = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: y1 }, { x: w - D, y: y1 }, { x: w - D, y: y0 }, { x: w, y: y0 }, { x: w, y: h }, { x: 0, y: h }];
  } else { roundRectPath(ctx, 0, 0, w, h, R); return; }
  // The bay may touch the island's corner: drop duplicated points, or the trace divides by zero.
  const out = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1]!.x || p.y !== pts[i - 1]!.y);
  if (out.length > 1 && out[out.length - 1]!.x === out[0]!.x && out[out.length - 1]!.y === out[0]!.y) out.pop();
  traceRounded(ctx, out, R);
}

/**
 * Paints one run's board: the island, the grid dots, the rocks, the road, the two gates, and
 * the marked cells' yellow dots.
 * Returns the texture key; the texture's top-left is (-BOARD_MARGIN, -BOARD_MARGIN) on the board.
 */
export function paintBoard(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine, marked: Cell[]): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const w = map.cols * CELL;
  const h = map.rows * CELL;
  const m = BOARD_MARGIN;
  paintTexture(scene, key, w + m * 2, h + m * 2, (ctx) => {
    ctx.translate(m, m);
    drawBoard(ctx, map, path, marked);
  });
  return key;
}

/**
 * Paints a small preview of a board for the pick step's cards, at `px` times its size in plain
 * pixels (1: not ART, so it is shown with a plain setScale, not artScale). It paints the same map
 * as the run will, so the card shows the board the run plays.
 * Returns the texture key; the texture's top-left is (-BOARD_MARGIN, -BOARD_MARGIN) on the board.
 */
export function paintBoardPreview(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine, marked: Cell[], px = 1): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const w = map.cols * CELL;
  const h = map.rows * CELL;
  const m = BOARD_MARGIN;
  const tex = scene.textures.createCanvas(key, Math.ceil((w + m * 2) * px), Math.ceil((h + m * 2) * px));
  if (!tex) return key;
  const ctx = tex.getContext();
  ctx.scale(px, px);
  ctx.translate(m, m);
  drawBoard(ctx, map, path, marked);
  tex.refresh();
  return key;
}

/** The leak warning: a red copy of the exit gate (same square, white ring), shown over the board. */
export function paintExitWarn(scene: Phaser.Scene): string {
  const c = CELL * 0.3;
  const size = c * 2 + 32;
  paintTexture(scene, 'exit-warn', size, size, (ctx) => {
    const x = size / 2, y = size / 2;
    ctx.save();
    setShadow(ctx, 0.8);
    roundRectPath(ctx, x - c, y - c, c * 2, c * 2, CELL * 0.16);
    ctx.fillStyle = rgba(PALETTE.red, 1);
    ctx.fill();
    ctx.restore();
    shapePath(ctx, 'circle', x, y, CELL * 0.12);
    ctx.lineWidth = CELL * 0.07;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
  return 'exit-warn';
}
