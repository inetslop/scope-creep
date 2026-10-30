import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import { artScale, CHIP_TEXTURE } from '../../art/textures';
import type { FxSystem } from '../FxSystem';

/** One small yellow chip at a critting pellet's impact (T0299), on top of the enemy's white flash. */
export function critChip(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const chip = artScale(fx.scene.add.image(x, y, CHIP_TEXTURE), 0.8).setTint(PALETTE.yellow).setDepth(DEPTH.fx);
  fx.track(chip, 220, { y: y - 14, alpha: 0, ease: 'Quad.easeOut' });
}
