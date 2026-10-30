import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The ring a tower blooms at its base when its kill count crosses a milestone (T0270). */
export function milestoneRing(fx: FxSystem, x: number, y: number, color: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, CELL, 3, 0, Math.PI * 2, color, 0.9);
  g.setScale(0.4);
  fx.track(g, 300, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
