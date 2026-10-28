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
  /** A chevron at the tip: the shots lead where the enemy is going (Lead first). */
  chevronTip?: boolean;
  /** Small green chevron ticks on the barrel face, one per extra Lead added. */
  chevrons?: number;
}

/**
 * A barrel texture for `color` and `look`, painted the first time it is needed. It points up
 * from the texture center, which is its pivot.
 */
export function barrelTexture(scene: Phaser.Scene, color: Bright | undefined, look: BarrelLook): string {
  const length = Math.round(look.length * 10) / 10;
  const width = Math.round(look.width * 20) / 20;
  const bands = Math.max(0, Math.min(3, Math.round(look.bands)));
  const chevrons = Math.max(0, Math.round(look.chevrons ?? 0));
  const key = `barrel:${color ?? 'empty'}:${length}:${width}:${look.bulb ? 'b' : 'p'}:${bands}:${look.chevronTip ? 'c' : 'n'}:${chevrons}`;
  const r = TOWER_BODY * CELL;
  const len = r * 1.6 * length;
  const w = r * 0.6 * width;
  const bulb = look.bulb ? w * 0.95 : 0;
  // Room above the tip for the chevron, so it does not paint into a hard texture edge.
  const size = (len + (look.chevronTip ? w * 2.4 : 0) + bulb + 4) * 2;
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
    if (look.chevronTip) {
      // The chevron tip (the Sprinter's shape): the barrel reads "chases runners".
      shapePath(ctx, 'chevron', c, c - len - w * 0.55, w * 0.9);
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
    // Lead ticks: one small green chevron per extra Lead, on the barrel face.
    for (let i = 0; i < chevrons; i++) {
      shapePath(ctx, 'chevron', c, c - len * (0.28 + 0.14 * i), w * 0.42);
      ctx.fillStyle = rgba(PALETTE.green, 1);
      ctx.fill();
    }
  });
  return key;
}
