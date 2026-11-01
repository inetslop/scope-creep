import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The Flyer's tell: the moment it spawns, one thin purple ring at its entry point on the island's edge grows and fades over 0.5 s (the boss-arrival ring's language, T0312). */
export function flyRing(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const r = 1.25 * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 2, 0, Math.PI * 2, PALETTE.purple, 0.6);
  g.setScale(0.3);
  fx.track(g, 500, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
