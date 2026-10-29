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
  /** Short orange ticks on the barrel face, one per Ember added (the burn keeps ticking). */
  emberTicks?: number;
  /** A small ember dot at the muzzle: the burn is the tower's own attack (Ember first). */
  emberMuzzle?: boolean;
  /** A short, flat, wide head lying on the plinth: the beam never fires (Beam first). */
  beamHead?: boolean;
  /** Small flat ticks beside the head or the barrels, one per Beam added. */
  beamTicks?: number;
  /** Short ticks in the tower's own color on the head face, one per Spray copy (the split grows). */
  sprayTicks?: number;
}

/**
 * A barrel texture for `color` and `look`, painted the first time it is needed. It points up
 * from the texture center, which is its pivot.
 */
export function barrelTexture(scene: Phaser.Scene, color: Bright | undefined, look: BarrelLook): string {
  const length = Math.round(look.length * 10) / 10;
  const width = Math.round(look.width * 20) / 20;
  const bands = Math.max(0, Math.min(3, Math.round(look.bands)));
  const emberTicks = Math.max(0, Math.round(look.emberTicks ?? 0));
  const emberMuzzle = look.emberMuzzle ?? false;
  const beamHead = look.beamHead ?? false;
  // A tower holds at most three added augments, so at most three ticks.
  const beamTicks = Math.max(0, Math.min(3, Math.round(look.beamTicks ?? 0)));
  // At most four Sprays fit in a tower, so at most four ticks.
  const sprayTicks = Math.max(0, Math.min(4, Math.round(look.sprayTicks ?? 0)));
  const key = beamHead
    ? `barrel:beam:${color ?? 'empty'}:${beamTicks}`
    : `barrel:${color ?? 'empty'}:${length}:${width}:${look.bulb ? 'b' : 'p'}:${bands}:${emberTicks}:${sprayTicks}:${emberMuzzle ? 'e' : 'n'}:${beamTicks}`;
  const r = TOWER_BODY * CELL;
  const len = r * 1.6 * length;
  const w = r * 0.6 * width;
  const bulb = look.bulb ? w * 0.95 : 0;
  // The beam ticks sit beside the head or the barrel: the texture leaves them room, or they end in a hard edge.
  const side = beamTicks > 0 ? 6 + (beamTicks - 1) * 10 + 8 : 0;
  const size = beamHead ? (w + 30) * 2 : Math.max((len + bulb + 4) * 2, (Math.max(w, len) + side + 4) * 2);
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
    // Ember ticks: one short orange dash per Ember added, in the band's style.
    for (let i = 0; i < emberTicks; i++) {
      const at = c - len * (0.18 + 0.1 * i);
      roundRectPath(ctx, c - w * 0.6, at - w * 0.19, w * 1.2, w * 0.38, w * 0.19);
      ctx.fillStyle = rgba(color === 'orange' ? PALETTE.orangeDeep : PALETTE.orange, 1);
      ctx.fill();
    }
    // Spray ticks: one short tick in the tower's own color per Spray copy (the split grows with copies).
    for (let i = 0; i < sprayTicks; i++) {
      const at = c - len * (0.82 - 0.08 * i);
      roundRectPath(ctx, c - w * 0.6, at - w * 0.19, w * 1.2, w * 0.38, w * 0.19);
      ctx.fillStyle = rgba(color ? PALETTE[color] : PALETTE.faint, 1);
      ctx.fill();
    }
    if (emberMuzzle) {
      // The ember at the muzzle: a small dark-orange dot at the tip.
      shapePath(ctx, 'circle', c, c - len, w * 0.3);
      ctx.fillStyle = rgba(PALETTE.orangeDeep, 1);
      ctx.fill();
    }
    // Beam ticks: one small flat dash per Beam added, beside the head or the barrel, stacked 10 apart.
    for (let i = 0; i < beamTicks; i++) {
      const at = c - len / 2 + (i - (beamTicks - 1) / 2) * 10;
      roundRectPath(ctx, c + w / 2 + 6, at - 2, 8, 4, 2);
      ctx.fillStyle = deep;
      ctx.fill();
    }
  });
  return key;
}
