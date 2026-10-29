import type Phaser from 'phaser';
import { SHADOW } from './paint';

/**
 * Shared texture helpers. Every texture is painted in code (there are no image files), by the
 * painter modules next to this one, registered in art/generate.ts.
 *
 * Textures are painted at ART times their size on the board, so they stay crisp when the camera
 * zooms in and on high-density screens; images that use them are shown at ART_SCALE (artScale()).
 */
export const ART = 3;
export const ART_SCALE = 1 / ART;

export const enemyTexture = (id: string): string => `enemy:${id}`;
/** A tower body for the tower's first augment (undefined: empty, grey). */
export const towerTexture = (firstAugment: string | undefined): string => `tower:${firstAugment ?? 'empty'}`;
export const augmentTexture = (id: string): string => `augment:${id}`;
export const TOWER_BASE = 'tower:base';
export const BOLT_TEXTURE = 'fx:bolt';
/** A thin straight tracer for a piercing shot (Lance): it keeps going after a hit. */
export const TRACER_TEXTURE = 'fx:tracer';
export const CHIP_TEXTURE = 'fx:chip';
/** A flat plate across a token's front third (the Bulwark): painted once, shown by Enemy. */
export const PLATE_TEXTURE = 'enemy:plate';
export const COIN_TEXTURE = 'ui:coin';
export const LIFE_TEXTURE = 'ui:life';
export const STAR_TEXTURE = 'ui:star';
export const GEM_TEXTURE = 'ui:gem';

/** Size of a tower body (radius, in cells). */
export const TOWER_BODY = 0.22;

/** Shows an image of an ART texture at `size` times its natural size. */
export function artScale<T extends Phaser.GameObjects.Components.Transform>(obj: T, size = 1): T {
  obj.setScale(ART_SCALE * size);
  return obj;
}

/** Paints a texture `w` x `h` board units big (drawing in board units), once. */
export function paintTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, Math.ceil(w * ART), Math.ceil(h * ART));
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(ART, ART);
  draw(ctx);
  tex.refresh();
}

/**
 * Room to leave around a token so its side face and soft shadow fade out inside the texture
 * (a texture edge that cuts a shadow shows up as a hard line on the board).
 */
export function tokenRoom(radius: number, depth: number, shadow = 1): number {
  return radius * 1.25 + depth + (SHADOW.offsetY + SHADOW.blur * 1.6) * shadow + 2;
}

/** The side-face depth of a token at radius `r`. */
export const tokenDepth = (r: number): number => Math.max(2, r * 0.18);
