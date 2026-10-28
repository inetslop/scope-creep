import type Phaser from 'phaser';
import { PALETTE, rgba } from '../content/palette';
import type { Point } from '../core/path';
import { setShadow } from './paint';
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

/** The road the menu demo plays on (scenes/MenuDemo.ts). */
export function paintMenuRoad(scene: Phaser.Scene): string {
  paintTexture(scene, MENU_ROAD, MENU_ROAD_SIZE.width, MENU_ROAD_SIZE.height, (ctx) => {
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
  });
  return MENU_ROAD;
}
