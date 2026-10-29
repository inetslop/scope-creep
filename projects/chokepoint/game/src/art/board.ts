import type Phaser from 'phaser';
import { CELL } from '../config';
import { PALETTE, rgba } from '../content/palette';
import { kindAt, type GameMap } from '../core/map';
import type { PathLine } from '../core/path';
import { paintToken, roundRectPath, setShadow, shapePath } from './paint';
import { paintTexture } from './textures';

/** Board units of empty space around the island in the board texture, for its shadow. */
export const BOARD_MARGIN = 40;

/**
 * Paints one run's board: the island, the grid dots, the rocks, the road and the two gates.
 * Returns the texture key; the texture's top-left is (-BOARD_MARGIN, -BOARD_MARGIN) on the board.
 */
export function paintBoard(scene: Phaser.Scene, key: string, map: GameMap, path: PathLine): string {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const w = map.cols * CELL;
  const h = map.rows * CELL;
  const m = BOARD_MARGIN;
  paintTexture(scene, key, w + m * 2, h + m * 2, (ctx) => {
    ctx.translate(m, m);
    // The island, raised off the ground.
    ctx.save();
    setShadow(ctx, 1.6);
    roundRectPath(ctx, 0, 0, w, h, CELL * 0.32);
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
    ctx.restore();

    // Bend notches: one flat muted tick on every build cell that touches a bend of the road.
    const notched = new Set<string>();
    ctx.fillStyle = rgba(PALETTE.muted, 1);
    for (let i = 1; i < map.path.length - 1; i++) {
      const a = map.path[i - 1]!, b = map.path[i]!, c = map.path[i + 1]!;
      if (b.col - a.col === c.col - b.col && b.row - a.row === c.row - b.row) continue; // straight, no bend
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const col = b.col + dc, row = b.row + dr;
          if (kindAt(map, col, row) !== 'open') continue; // path, rock or off-board: no build cell
          const key = `${col},${row}`;
          if (notched.has(key)) continue;
          notched.add(key);
          const nx = Math.sign(dc), ny = Math.sign(dr);
          const len = Math.hypot(nx, ny); // 1 or sqrt(2), never 0 (dc/dr both 0 is the path cell)
          const px = (col + 0.5) * CELL + (nx / len) * CELL * 0.38;
          const py = (row + 0.5) * CELL + (ny / len) * CELL * 0.38;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.atan2(ny, nx));
          roundRectPath(ctx, -CELL * 0.06, -CELL * 0.15, CELL * 0.12, CELL * 0.3, CELL * 0.06);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Gates: where enemies come in (grey, a white chevron) and the exit you defend (ink, a white ring).
    const gate = (p: { x: number; y: number }, exit: boolean): void => {
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
        const dir = Math.atan2(second.y - first.y, second.x - first.x);
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
  });
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
