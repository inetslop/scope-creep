import { DEPTH } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/**
 * The move's fee, paid at the tower's old cell as it slides off: a small gold "−N" that rises and
 * fades — the sell's gold-pop language (FxSystem.popText) with a minus, since this one costs. The
 * style repeats ui/text.ts' textStyle(20, goldText, bold, card stroke) instead of importing it:
 * anything in ui/ drags in debug/flags, which reads window at load and breaks the Node unit tests.
 */
export function moveChip(fx: FxSystem, x: number, y: number, amount: number): void {
  if (fx.full) return;
  const t = fx.scene.add.text(x, y, `−${amount}`, {
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: '20px',
    fontStyle: 'bold',
    color: cssColor(PALETTE.goldText),
    stroke: cssColor(PALETTE.card),
    strokeThickness: 5,
    resolution: 1 / fx.scene.scale.zoom,
  });
  t.setOrigin(0.5);
  t.setDepth(DEPTH.fx);
  fx.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
}
