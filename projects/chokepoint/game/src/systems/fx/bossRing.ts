import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The boss's arrival ring: a muted ring in the boss's own color that blooms from its base out to two cells, over ~0.6 s (T0312). */
export function bossRing(fx: FxSystem, x: number, y: number, color: number): void {
  if (fx.full) return;
  const r = 2 * CELL; // boss scale: out to two cells, as the gate's pulse
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, color, 0.6);
  g.setScale(0.5);
  fx.track(g, 600, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
