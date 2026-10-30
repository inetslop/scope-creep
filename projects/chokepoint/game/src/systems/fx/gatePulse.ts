import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The boss's arrival: a wide ring in muted ink that blooms from the entrance gate out to two cells, then fades. */
export function gatePulse(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = 2 * CELL; // out to two cells
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 8, 0, Math.PI * 2, PALETTE.ink, 0.6);
  g.setScale(0.15);
  fx.track(g, 500, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
