import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The quiet ring at a support tower's base each time its aura works (T0055). */
export function auraRing(fx: FxSystem, x: number, y: number, color: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, CELL, 3, 0, Math.PI * 2, color, 0.9);
  g.setScale(0.5);
  fx.track(g, 1000, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
