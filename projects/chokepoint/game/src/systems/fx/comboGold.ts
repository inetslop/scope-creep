import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/**
 * The chain milestone's gold: one small pop at the kill spot, 100 ms after the kill gold (like Mint's "+1").
 * The style repeats ui/text.ts' textStyle(14, goldText, ...) instead of importing it: anything in ui/
 * drags in debug/flags, which reads window at load and breaks the Node unit tests. The canvas is sized in
 * device pixels and shown with zoom 1/ratio (main.ts), so resolution 1/zoom equals display.ratio.
 */
export function comboGoldPop(fx: FxSystem, x: number, y: number, amount: number): void {
  if (fx.full) return;
  fx.scene.time.delayedCall(100, () => {
    if (fx.full) return;
    const t = fx.scene.add
      .text(x, y, `+${amount}`, {
        fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: cssColor(PALETTE.goldText),
        stroke: cssColor(PALETTE.card),
        strokeThickness: 4,
        resolution: 1 / fx.scene.scale.zoom,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.fx);
    fx.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
  });
}
