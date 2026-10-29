import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/**
 * The name of a shape the first time it appears in a run: a small white chip pops above the spawn
 * spot, holds, and fades while the enemy walks on (it stays put, it is not a follower). The style
 * repeats ui/text.ts' textStyle(12, muted, ...) instead of importing it: anything in ui/ drags in
 * debug/flags, which reads window at load and breaks the Node unit tests. The canvas is sized in
 * device pixels and shown with zoom 1/ratio (main.ts), so resolution 1/zoom equals display.ratio.
 */
export function nameLabel(fx: FxSystem, x: number, y: number, name: string): void {
  if (fx.full) return;
  const label = fx.scene.add.text(0, -1, name, {
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: cssColor(PALETTE.muted),
    resolution: 1 / fx.scene.scale.zoom,
  });
  label.setOrigin(0.5);
  const g = fx.scene.add.graphics();
  const w = label.width + 14;
  g.fillStyle(PALETTE.cardDeep, 1);
  g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
  g.fillStyle(PALETTE.card, 1);
  g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
  const chip = fx.scene.add.container(x, y - 30, [g, label]);
  chip.setDepth(DEPTH.fx).setScale(0);
  fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(chip, 100, { alpha: 0, delay: 900, ease: 'Quad.easeIn' }); // gone in ~1 s
}
