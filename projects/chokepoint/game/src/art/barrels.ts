import type Phaser from 'phaser';
import { CELL } from '../config';
import { deepOf, PALETTE, rgba, type Bright } from '../content/palette';
import { roundRectPath, shapePath } from './paint';
import { paintTexture, TOWER_BODY } from './textures';

/** Barrel looks, as multiples of a plain Bolt barrel (entities/towerLook.ts works them out). */
export interface BarrelLook {
  /** Length factor: longer for more range (Reach, the sniper). */
  length: number;
  /** Width factor: thinner for faster, lighter shots (Rapid), thicker for heavy ones. */
  width: number;
  /** A round bulb at the tip: the shots burst (Splash). */
  bulb: boolean;
  /** Yellow bands around the barrel, one per speed-up (Rapid added). */
  bands: number;
}

/**
 * A barrel texture for `color` and `look`, painted the first time it is needed. It points up
 * from the texture center, which is its pivot.
 */
export function barrelTexture(scene: Phaser.Scene, color: Bright | undefined, look: BarrelLook): string {
  const length = Math.round(look.length * 10) / 10;
  const width = Math.round(look.width * 20) / 20;
  const bands = Math.max(0, Math.min(3, Math.round(look.bands)));
  const key = `barrel:${color ?? 'empty'}:${length}:${width}:${look.bulb ? 'b' : 'p'}:${bands}`;
  const r = TOWER_BODY * CELL;
  const len = r * 1.6 * length;
  const w = r * 0.6 * width;
  const bulb = look.bulb ? w * 0.95 : 0;
  const size = (len + bulb + 4) * 2;
  paintTexture(scene, key, size, size, (ctx) => {
    const c = size / 2;
    const deep = rgba(color ? deepOf(color) : PALETTE.rockDeep, 1);
    roundRectPath(ctx, c - w / 2, c - len, w, len, w / 2);
    ctx.fillStyle = deep;
    ctx.fill();
    if (look.bulb) {
      shapePath(ctx, 'circle', c, c - len, bulb);
      ctx.fillStyle = deep;
      ctx.fill();
    }
    // Speed bands: a little wider than the barrel, spread over its outer half.
    for (let i = 0; i < bands; i++) {
      const at = c - len * (0.45 + 0.17 * i);
      roundRectPath(ctx, c - w * 0.7, at - w * 0.28, w * 1.4, w * 0.56, w * 0.28);
      ctx.fillStyle = rgba(PALETTE.yellow, 1);
      ctx.fill();
    }
  });
  return key;
}
