import type Phaser from 'phaser';
import { PALETTE, rgba } from '../content/palette';
import type { Point } from '../core/path';
import { roundRectPath, setShadow } from './paint';
import { paintTexture } from './textures';

export const MENU_ROAD = 'ui:menu-road';

/** The menu's road, in its texture's units (MENU_ROAD_SIZE), from where enemies enter to where they leave. */
export const MENU_ROAD_POINTS: readonly Point[] = [
  { x: 0, y: 96 },
  { x: 110, y: 96 },
  { x: 110, y: 46 },
  { x: 250, y: 46 },
  { x: 250, y: 96 },
  { x: 360, y: 96 },
];
export const MENU_ROAD_SIZE = { width: 360, height: 150 } as const;
export const MENU_ROAD_PAD = 28; // left of the road: the entrance gate's token and shadow (like the board's margin)
export const MENU_ROAD_TEX = { width: MENU_ROAD_SIZE.width + MENU_ROAD_PAD, height: MENU_ROAD_SIZE.height } as const;
export const MENU_FAR_GATE: Point = { x: 110, y: 53 }; // ~a third of the way in (the road is 460 long)
export const MENU_FAR_GATE_DISTANCE = 153; // 110 along the first segment, then 96-53 up the second

/** The menu's gate, in menu units (the board's look, art/board.ts): a faint token with a white chevron in the road's travel. */
function paintGate(ctx: CanvasRenderingContext2D, p: Point, dir: number): void {
  ctx.save();
  setShadow(ctx, 0.8);
  roundRectPath(ctx, p.x - 18, p.y - 18, 36, 36, 9.6);
  ctx.fillStyle = rgba(PALETTE.faint, 1);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(dir);
  ctx.beginPath();
  ctx.moveTo(-4.2, -7.2);
  ctx.lineTo(4.2, 0);
  ctx.lineTo(-4.2, 7.2);
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

/** The road the menu demo plays on (scenes/MenuDemo.ts), with its two gates: the entrance and the far gate. */
export function paintMenuRoad(scene: Phaser.Scene): string {
  paintTexture(scene, MENU_ROAD, MENU_ROAD_TEX.width, MENU_ROAD_SIZE.height, (ctx) => {
    // The whole texture sits MENU_ROAD_PAD to the right of the road: the entrance gate's token
    // and shadow need the pad, so the road and both gates share this one translation.
    ctx.translate(MENU_ROAD_PAD, 0);
    ctx.save();
    setShadow(ctx, 0.7);
    ctx.beginPath();
    MENU_ROAD_POINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.lineWidth = 34;
    ctx.strokeStyle = rgba(PALETTE.road, 1);
    ctx.stroke();
    ctx.restore();
    const dirIn = Math.atan2(MENU_ROAD_POINTS[1]!.y - MENU_ROAD_POINTS[0]!.y, MENU_ROAD_POINTS[1]!.x - MENU_ROAD_POINTS[0]!.x);
    paintGate(ctx, MENU_ROAD_POINTS[0]!, dirIn);
    paintGate(ctx, MENU_FAR_GATE, -Math.PI / 2); // the road travels up here, toward the exit
  });
  return MENU_ROAD;
}
