import { artScale, COIN_TEXTURE } from '../../art/textures';
import { DEPTH } from '../../config';
import type { Point } from '../../core/path';
import type { FxSystem } from '../FxSystem';

/**
 * A kill's gold coin: the same coin icon as the gold tally (art/icons.ts), `size` board units
 * across, leaving `from` (the gold pop's anchor) for `to` (the gold number in the stats card,
 * ui/hud/StatsCard.ts) — in addition to the gold pop (FxSystem.popText), one symbol per kill.
 * Over 200 ms on a short upward arc, ease-out, fading in its last ~30 ms; destroyed on arrival,
 * with a 500 ms safety timeout.
 */
export function goldCoin(fx: FxSystem, from: Point, to: Point, size: number, arc: number): void {
  if (fx.full) return;
  // The coin texture is 28 board units wide (art/icons.ts): size board units is size / 28 of it.
  const img = artScale(fx.scene.add.image(0, 0, COIN_TEXTURE), size / 28);
  const coin = fx.scene.add.container(from.x, from.y, [img]).setDepth(DEPTH.fx);
  fx.scene.tweens.add({ targets: img, y: -arc, duration: 100, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  fx.scene.tweens.add({ targets: coin, alpha: 0, delay: 170, duration: 30, ease: 'Quad.easeIn' });
  let alive = true;
  const finish = (): void => {
    if (alive) {
      alive = false;
      coin.destroy();
    }
  };
  fx.scene.time.delayedCall(500, finish);
  fx.track(coin, 200, { x: to.x, y: to.y, ease: 'Quad.easeOut' });
}
