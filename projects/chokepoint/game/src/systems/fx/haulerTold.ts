import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/** The Hauler's extra cost, taught once: "the Hauler also takes 5 gold" at the exit gate. Same look and life as the first-leak chip. */
export function haulerTold(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const label = fx.scene.add.text(0, -1, 'the Hauler also takes 5 gold', {
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
  const chip = fx.scene.add.container(x, y, [g, label]);
  chip.setDepth(DEPTH.fx).setScale(0);
  fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' }); // hold 1 s, out 300 ms
}
