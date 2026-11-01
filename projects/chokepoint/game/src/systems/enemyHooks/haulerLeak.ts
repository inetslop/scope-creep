import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import { artScale, COIN_TEXTURE } from '../../art/textures';
import type { MakeEnemyHook } from './hook';

/**
 * The Hauler's leak: the 5 gold it costs (gold never goes below 0). The first Hauler leak stays
 * the teach chip alone (haulerTeach, below); every later one also shows the cost at the exit:
 * a small white chip, the HUD's own coin icon and a bold "-5", the first-leak chip's look
 * (fx/leakCost.ts). The jolt and the sound are the usual leak's.
 */
export const haulerLeak: MakeEnemyHook = ({ run, fx, board }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler') return;
    run.gold = Math.max(0, run.gold - 5); // every Hauler leak, the first included
    if (!run.haulerTold) return; // first Hauler leak: read BEFORE haulerTeach (below) sets it
    const pts = board.path.points; // same exit anchor as the teach chip (haulerTeach.ts)
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    fx.scene.time.delayedCall(100, () => {
      if (fx.full) return;
      const px = board.toScreen({ x: 1, y: 0 }).x - board.toScreen({ x: 0, y: 0 }).x; // CSS px per board unit
      const coin = artScale(fx.scene.add.image(0, -1, COIN_TEXTURE), 10 / (28 * px)); // the HUD's own coin, ~10 px
      const label = fx.scene.add.text(0, -1, '-5', {
        fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: cssColor(PALETTE.muted),
        resolution: 1 / fx.scene.scale.zoom,
      });
      label.setOrigin(0.5);
      const coinW = coin.displayWidth; // board units (its ~10 px)
      const w = coinW + 6 + label.width + 14; // the exit chip's body: same 14 padding as fx/leakCost.ts
      const g = fx.scene.add.graphics();
      g.fillStyle(PALETTE.cardDeep, 1);
      g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
      g.fillStyle(PALETTE.card, 1);
      g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
      const cx = -w / 2 + coinW / 2;
      coin.x = cx;
      label.x = cx + (coinW + label.width) / 2 + 3; // 6 px gap coin→label
      const chip = fx.scene.add.container(x, y, [g, coin, label]);
      chip.setDepth(DEPTH.fx).setScale(0);
      fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
      fx.track(chip, 300, { alpha: 0, delay: 1500, ease: 'Quad.easeIn' }); // hold ~1.5 s, out 300 ms
    });
  },
});
