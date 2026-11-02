import { CELL, DEPTH } from '../../config';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The Mender's closing telegraph: one thin ring in its own orange contracts from `fromCells`
 *  cells in to the token (every other ring on the board grows outward — the closing one reads as
 *  taking back), the moment its mend lands (systems/enemyHooks/mendPack.ts). */
export function mendRing(fx: FxSystem, x: number, y: number, fromCells: number, toRadius: number, color: number): void {
  if (fx.full) return;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, fromCells * CELL, 3, 0, Math.PI * 2, color, 0.9);
  fx.track(g, 1200, { scale: toRadius / (fromCells * CELL), alpha: 0, ease: 'Quad.easeIn' });
}
