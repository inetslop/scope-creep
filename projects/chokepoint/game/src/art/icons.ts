import type Phaser from 'phaser';
import { CELL } from '../config';
import { AUGMENTS } from '../content/augments';
import { deepOf, PALETTE, rgba } from '../content/palette';
import { paintToken, shapePath } from './paint';
import { augmentTexture, COIN_TEXTURE, GEM_TEXTURE, LIFE_TEXTURE, paintTexture, tokenRoom } from './textures';

/** Icons for cards and the HUD: one per augment (its own token), the coin, the life. */
export function paintIconTextures(scene: Phaser.Scene): void {
  for (const a of AUGMENTS) {
    const ar = a.look.size * CELL;
    const size = tokenRoom(ar, ar * 0.18, 0.6) * 2;
    paintTexture(scene, augmentTexture(a.id), size, size, (ctx) => {
      paintToken(ctx, a.look.shape, size / 2, size / 2 - ar * 0.09, ar, PALETTE[a.look.color], deepOf(a.look.color), { depth: ar * 0.18 });
    });
  }
  // A flat gem for the tier rows on draft cards (tinted by the tier).
  paintTexture(scene, GEM_TEXTURE, 10, 10, (ctx) => {
    shapePath(ctx, 'diamond', 5, 5, 4.6);
    ctx.fillStyle = rgba(PALETTE.card, 1);
    ctx.fill();
  });
  paintTexture(scene, COIN_TEXTURE, 28, 28, (ctx) => paintToken(ctx, 'circle', 14, 12, 9, PALETTE.yellow, PALETTE.yellowDeep, { depth: 3, shadow: false }));
  paintTexture(scene, LIFE_TEXTURE, 28, 28, (ctx) => {
    paintToken(ctx, 'square', 14, 12, 8.5, PALETTE.ink, PALETTE.ink, { depth: 0, shadow: false });
    shapePath(ctx, 'circle', 14, 12, 4.2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
}
