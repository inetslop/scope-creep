import type Phaser from 'phaser';
import { PALETTE, rgba } from '../content/palette';
import { roundRectPath } from '../art/paint';

/** Space around a card texture for its shadow, in pixels. */
const PAD = 18;

/** Cards are painted at this many times their size and shown at 1/CARD_RES, to stay crisp at any pixel density. */
export const CARD_RES = 3;

/** A rounded card with a soft shadow, as a texture (cached per size and color). */
export function cardTexture(scene: Phaser.Scene, width: number, height: number, radius: number, fill: number = PALETTE.card): string {
  const w = Math.round(width);
  const h = Math.round(height);
  const key = `card:${w}x${h}:${radius}:${fill.toString(16)}`;
  if (scene.textures.exists(key)) return key;
  const k = CARD_RES;
  const tex = scene.textures.createCanvas(key, (w + PAD * 2) * k, (h + PAD * 2) * k);
  if (!tex) return '__DEFAULT';
  const ctx = tex.getContext();
  ctx.scale(k, k);
  ctx.shadowColor = rgba(PALETTE.ink, 0.16);
  ctx.shadowBlur = 14 * k;
  ctx.shadowOffsetY = 4 * k;
  roundRectPath(ctx, PAD, PAD, w, h, radius);
  ctx.fillStyle = rgba(fill, 1);
  ctx.fill();
  tex.refresh();
  return key;
}

/** Marks an image as a card of this size (for the layout check; the painted texture is bigger by the shadow pad). */
export function markCard(img: Phaser.GameObjects.Image, width: number, height: number): void {
  img.setData('card', true).setData('cardW', width).setData('cardH', height);
}

/** A card image centered on (x, y). */
export function makeCard(scene: Phaser.Scene, x: number, y: number, width: number, height: number, radius = 16, fill: number = PALETTE.card): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, cardTexture(scene, width, height, radius, fill)).setScale(1 / CARD_RES);
  markCard(img, width, height);
  return img;
}
