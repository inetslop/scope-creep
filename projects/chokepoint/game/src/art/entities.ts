import type Phaser from 'phaser';
import { CELL } from '../config';
import { AUGMENTS } from '../content/augments';
import { ENEMIES, getEnemy } from '../content/enemies';
import { deepOf, PALETTE, rgba, type Bright } from '../content/palette';
import type { Shape } from '../content/types';
import { paintToken, roundRectPath, setShadow, shapePath } from './paint';
import { BOLT_TEXTURE, CHIP_TEXTURE, DISC_TEXTURE, enemyTexture, paintTexture, PLATE_TEXTURE, TOWER_BASE, TOWER_BODY, tokenDepth, tokenRoom, TRACER_TEXTURE, towerTexture } from './textures';

/** Enemies, tower plinths and bodies, bolts and chips: everything that stands or flies on the board. */
export function paintEntityTextures(scene: Phaser.Scene): void {
  for (const e of ENEMIES) {
    const r = e.look.size * CELL;
    const depth = tokenDepth(r);
    const size = tokenRoom(r, depth) * 2;
    paintTexture(scene, enemyTexture(e.id), size, size, (ctx) => {
      paintToken(ctx, e.look.shape, size / 2, size / 2 - depth / 2, r, PALETTE[e.look.color], deepOf(e.look.color), { depth });
      if (e.splitsInto !== undefined) {
        // One thin crack across the face: the road's white, so it reads as a split line.
        const cx = size / 2, cy = size / 2 - depth / 2;
        ctx.strokeStyle = rgba(PALETTE.road, 1);
        ctx.lineWidth = Math.max(1, r * 0.1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, cy - r * 0.1);
        ctx.lineTo(cx + r * 0.05, cy + r * 0.12);
        ctx.lineTo(cx + r * 0.55, cy - r * 0.02);
        ctx.stroke();
      }
      if (e.id === 'hauler') {
        // The Hauler wears its coin: the HUD's own coin shape, flat on the face, a third of the width.
        shapePath(ctx, 'circle', size / 2, size / 2 - depth / 2, r / 3);
        ctx.fillStyle = rgba(PALETTE.yellow, 1);
        ctx.fill();
      }
      if (e.id === 'ward') {
        // The Ward's armor: one thin ring around its edge, in the side-face red. Still: painted into the
        // texture, never tweened or rotated (its side face and shadow must stay at the bottom).
        ctx.strokeStyle = rgba(deepOf(e.look.color), 1);
        ctx.lineWidth = Math.max(1, r * 0.16);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2 - depth / 2, r * 0.88, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (e.id === 'orb') {
        // The Orb's crack: a thin jagged line down the middle of its face, in the muted ink (the
        // Hauler's coin language). Painted in, never tweened: the standing telegraph that it splits.
        const cx = size / 2, cy = size / 2 - depth / 2;
        ctx.strokeStyle = rgba(PALETTE.muted, 1);
        ctx.lineWidth = Math.max(1, r * 0.1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.55);
        ctx.lineTo(cx - r * 0.08, cy - r * 0.06);
        ctx.lineTo(cx + r * 0.06, cy + r * 0.12);
        ctx.lineTo(cx, cy + r * 0.5);
        ctx.stroke();
      }
    });
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
  // The Bulwark's plate: a flat arc across the front third of its face, in the side-face red. Flat
  // (no shading), so it may rotate: Enemy turns it to face the travel every frame.
  const bR = getEnemy('bulwark').look.size * CELL;
  const bDepth = tokenDepth(bR);
  const plateSize = tokenRoom(bR, bDepth) * 2;
  paintTexture(scene, PLATE_TEXTURE, plateSize, plateSize, (ctx) => {
    ctx.strokeStyle = rgba(deepOf('red'), 1);
    ctx.lineWidth = bR * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(plateSize / 2, plateSize / 2 - bDepth / 2, bR * 0.72, -Math.PI / 2 - Math.PI / 3, -Math.PI / 2 + Math.PI / 3);
    ctx.stroke();
  });
  // The Guard's shield disc: one flat circle on its road-facing front, in the coin's orange
  // (the Hauler's coin language: the shield is visible on the enemy that carries it). Flat (no
  // shading), so it may rotate: Enemy turns it to face the travel every frame; it dies with the Guard.
  const gR = getEnemy('guard').look.size * CELL;
  const gDepth = tokenDepth(gR);
  const discSize = tokenRoom(gR, gDepth) * 2;
  paintTexture(scene, DISC_TEXTURE, discSize, discSize, (ctx) => {
    ctx.fillStyle = rgba(PALETTE.orange, 1);
    ctx.beginPath();
    ctx.arc(discSize / 2, discSize / 2 - gDepth / 2 - gR * 0.55, gR * 0.42, 0, Math.PI * 2);
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
