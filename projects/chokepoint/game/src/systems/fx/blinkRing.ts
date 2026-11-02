import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The Blinker's telegraph ring: one thin ring in its own pink that blooms at the destination the moment it is set (T0402). */
export function blinkRing(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = 0.5 * CELL; // the destination marked, not a boss-scale bloom: half a cell, one thin ring
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 2, 0, Math.PI * 2, PALETTE.pink, 0.9);
  g.setScale(0.5);
  fx.track(g, 700, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
