import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The wave's last kill: the soft ring in the road's white that blooms from the kill spot (T0229). */
export function clearRing(fx: FxSystem, x: number, y: number, fromRadius: number): void {
  if (fx.full) return;
  const r = 1.5 * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, PALETTE.road, 0.5);
  g.setScale(fromRadius / r);
  fx.track(g, 300, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
