import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The far gate's send: one thin muted-ink ring that blooms out from the far gate and fades, over ~0.6 s (T0360). */
export function farGateSend(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = CELL; // the gate's own cell (the boss blooms to two; this is the gate, not the boss)
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, PALETTE.ink, 0.6);
  g.setScale(0.35);
  fx.track(g, 600, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
