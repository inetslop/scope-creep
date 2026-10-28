import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/** A quick 150 ms orange spark line from the death spot to the enemy it leaps to (burn on death). */
export function burnSpark(fx: FxSystem, x0: number, y0: number, x1: number, y1: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx).lineStyle(3, PALETTE.orange, 0.9).setPosition(x0, y0);
  g.lineBetween(0, 0, x1 - x0, y1 - y0);
  fx.track(g, 150, { alpha: 0 });
}
