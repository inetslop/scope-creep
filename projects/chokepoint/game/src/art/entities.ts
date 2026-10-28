import type Phaser from 'phaser';
import { CELL } from '../config';
import { AUGMENTS } from '../content/augments';
import { ENEMIES } from '../content/enemies';
import { deepOf, PALETTE, rgba, type Bright } from '../content/palette';
import type { Shape } from '../content/types';
import { paintToken, roundRectPath, setShadow, shapePath } from './paint';
import { BOLT_TEXTURE, CHIP_TEXTURE, enemyTexture, paintTexture, TOWER_BASE, TOWER_BODY, tokenRoom, TRACER_TEXTURE, towerTexture } from './textures';

/** Enemies, tower plinths and bodies, bolts and chips: everything that stands or flies on the board. */
export function paintEntityTextures(scene: Phaser.Scene): void {
  for (const e of ENEMIES) {
    const r = e.look.size * CELL;
    const depth = Math.max(2, r * 0.18);
    const size = tokenRoom(r, depth) * 2;
    paintTexture(scene, enemyTexture(e.id), size, size, (ctx) => paintToken(ctx, e.look.shape, size / 2, size / 2 - depth / 2, r, PALETTE[e.look.color], deepOf(e.look.color), { depth }));
  }
  const plinth = CELL * 0.4;
  const base = tokenRoom(plinth, 5) * 2;
  paintTexture(scene, TOWER_BASE, base, base, (ctx) => {
    paintToken(ctx, 'square', base / 2, base / 2 - 3, plinth, PALETTE.card, PALETTE.cardDeep, { depth: 5 });
  });
  const r = TOWER_BODY * CELL;
  const bodySize = tokenRoom(r * 1.2, r * 0.16, 0.5) * 2;
  paintTexture(scene, towerTexture(undefined), bodySize, bodySize, (ctx) => paintTowerBody(ctx, 'circle', undefined, bodySize / 2));
  for (const a of AUGMENTS) paintTexture(scene, towerTexture(a.id), bodySize, bodySize, (ctx) => paintTowerBody(ctx, a.look.shape, a.look.color, bodySize / 2));
  paintTexture(scene, BOLT_TEXTURE, 16, 16, (ctx) => {
    shapePath(ctx, 'circle', 8, 8, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  // The tracer: a thin, long capsule pointing up from its center; the projectile rotates it to
  // where it flies. Tinted to the tower's color, so it is flat (no shading) and may rotate.
  paintTexture(scene, TRACER_TEXTURE, 4, 16, (ctx) => {
    roundRectPath(ctx, 0.25, 2, 3.5, 12, 1.75);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  paintTexture(scene, CHIP_TEXTURE, 14, 14, (ctx) => {
    roundRectPath(ctx, 2, 2, 10, 10, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
}

/**
 * The body of a tower, on its plinth: its first augment's shape and color (a grey circle while
 * empty). It never rotates (its side face must stay at the bottom); barrels turn under it.
 */
function paintTowerBody(ctx: CanvasRenderingContext2D, shape: Shape, color: Bright | undefined, c: number): void {
  const r = TOWER_BODY * CELL;
  const fill = color ? PALETTE[color] : PALETTE.faint;
  const deep = color ? deepOf(color) : PALETTE.rockDeep;
  ctx.save();
  setShadow(ctx, 0.5);
  shapePath(ctx, shape, c, c + r * 0.16, r);
  ctx.fillStyle = rgba(deep, 1);
  ctx.fill();
  ctx.restore();
  shapePath(ctx, shape, c, c, r);
  ctx.fillStyle = rgba(fill, 1);
  ctx.fill();
  // A small light dot: the eye of the tower (on the cap for a pillar).
  shapePath(ctx, 'circle', c, shape === 'pillar' ? c - r * 0.78 : c - r * 0.05, r * 0.2);
  ctx.fillStyle = rgba(PALETTE.card, 0.95);
  ctx.fill();
}
