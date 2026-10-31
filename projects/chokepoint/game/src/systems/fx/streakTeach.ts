import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import { textStyle } from '../../ui/text';
import type { FxSystem } from '../FxSystem';

/** The run's first clean wave: the muted line under the clean text naming the streak's pay.
 * Pops in, ~1.5 s, no sound, no input; the text is destroyed when it fades. */
export function streakTeach(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const label = fx.scene.add
    .text(x, y, '3 in a row brings a life back · once per run', textStyle(14, PALETTE.muted, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
    .setOrigin(0.5)
    .setDepth(DEPTH.fx)
    .setScale(0);
  fx.scene.tweens.add({ targets: label, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(label, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' }); // hold ~1 s, then fade and destroy
}
