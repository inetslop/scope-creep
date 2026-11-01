import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PLATE_TEXTURE } from '../../art/textures';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

const PEAK = 0.4;    // the touch of white: the plate's own color blended ~40% toward white
const KEEP_MS = 150; // stays lit this long after the last face hit (a spray = a steady glow, not a strobe)
const FADE_MS = 120; // fades this long after the face hits stop

/** The Bulwark's plate light-up: the moment a directed shot hits its face and the plate halves
 * it (EnemySystem sets `plated`), the plate brightens — its own color with a touch of white, a
 * white wash of the plate shape over it — fading over ~120 ms. One lit state per Bulwark: a face
 * hit while already lit (or mid-fade) just keeps it lit (no re-bloom, no stack); it holds ~150 ms
 * after the last face hit, and a back hit never lights it. Display-only: the 0.5 halving and the
 * Bulwark's numbers are untouched; no sound, no input.
 */
export const bulwarkPlate: MakeEnemyHook = ({ fx, enemies }) => {
  type S = { img: Phaser.GameObjects.Image; keepUntil: number; tw?: Phaser.Tweens.Tween };
  /** One lit state per Bulwark: its white-wash image, the real-ms it holds lit until, its fade. */
  const lit = new Map<Enemy, S>();
  const drop = (e: Enemy) => {
    const s = lit.get(e);
    if (!s) return;
    lit.delete(e);
    if (s.tw) s.tw.remove();
    s.img.destroy();
  };
  const light = (e: Enemy, now: number) => {
    const s = lit.get(e);
    if (s) { // already lit or mid-fade: keep it lit — no re-bloom, no stack
      if (s.tw) { s.tw.remove(); s.tw = undefined; }
      s.img.setAlpha(PEAK);
      s.keepUntil = now + KEEP_MS;
      return;
    }
    const img = fx.scene.add.image(0, 0, PLATE_TEXTURE);
    img.setTintFill(0xffffff).setAlpha(PEAK).setDepth(DEPTH.enemies + 1); // a white wash, over the plate
    lit.set(e, { img, keepUntil: now + KEEP_MS });
  };
  const track = (e: Enemy, s: S, now: number) => {
    s.img.setPosition(e.x, e.y).setScale(e.scale).setRotation(Math.atan2(e.dirX, -e.dirY)); // rides the walking Bulwark
    if (now < s.keepUntil || s.tw) return; // steady at the peak, or already fading
    s.tw = fx.scene.tweens.add({ targets: s.img, alpha: 0, duration: FADE_MS, ease: 'Quad.easeOut', onComplete: () => {
      const cur = lit.get(e);
      if (cur && cur.img === s.img) { lit.delete(e); s.img.destroy(); }
    } });
  };
  return {
    update() {
      const now = fx.scene.time.now;
      for (const e of enemies.all) {
        if (!e.active) continue;
        if (e.plated) { e.plated = false; light(e, now); } // the plate just halved a face hit
        const s = lit.get(e);
        if (s) track(e, s, now);
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
