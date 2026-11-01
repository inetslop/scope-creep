import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { cssColor, PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/** "Build beside the road" beside the entrance cell; up until Building fades it with fx.track. */
export function buildTeach(fx: FxSystem, x: number, y: number): Phaser.GameObjects.Container | null {
  if (fx.full) return null;
  const label = fx.scene.add.text(0, -1, 'Build beside the road', {
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: cssColor(PALETTE.ink),
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
  return chip;
}
