import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import { fillRing } from '../../ui/ring';
import type { MakeEnemyHook } from './hook';

/** The ring's full reach, in cells: out to ~0.5 cells from the base. */
const RING_CELLS = 0.5;
/** The ring's stroke. */
const W = 2;
/** Its muted alpha: the shrug is a hint, not a shout. */
const A = 0.4;
/** Its life, in real milliseconds (scene.time, not the simulation dt). */
const LIFE_MS = 400;
/** A Frost aura re-applies its slow nonstop; the Ward may refresh at most this often. */
const REFRESH_MS = 500;

/**
 * The Ward's shrug-off: the moment a control it ignores — a Frost slow (first apply or a
 * re-apply), an Anchor root, a Push gust or a per-hit push — is applied to it and takes no
 * effect, one small ring plays at its base: a thin ring in the Ward's own red, muted, growing
 * from the token's base out to ~0.5 cells while fading, at ground level under the token — so a
 * first-time player learns the Ward's rule from the board instead of from a leak.
 *
 * One ring at a time per Ward: a new event while one is playing restarts it from the top
 * (never stacks), and inside a Frost aura it refreshes no more often than once per 0.5 s. It
 * is display-only: the Ward's numbers and immunity are untouched, and no other enemy ever sets
 * `deny`. No sound, no input.
 */
export const wardDeny: MakeEnemyHook = ({ fx, enemies }) => {
  /** One live ring per Ward: its Graphics, its tween, and the real ms it last played. */
  const rings = new Map<Enemy, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween; last: number }>();
  const drop = (e: Enemy) => {
    const r = rings.get(e);
    if (!r) return;
    rings.delete(e);
    r.tw.remove();
    r.g.destroy();
  };
  const bloom = (e: Enemy, now: number) => {
    const r = rings.get(e);
    if (r && now - r.last < REFRESH_MS) return;
    drop(e); // the old ring (fading or not) goes; the new one starts from the top
    const R = RING_CELLS * CELL;
    const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y);
    fillRing(g, 0, 0, R, W, 0, Math.PI * 2, PALETTE[e.def.look.color], A);
    g.setScale((e.def.look.size * CELL) / R); // from the token's base
    const tw = fx.scene.tweens.add({
      targets: g, scale: 1, alpha: 0, duration: LIFE_MS, ease: 'Quad.easeOut',
      onComplete: () => {
        const cur = rings.get(e);
        if (cur && cur.g === g) {
          rings.delete(e);
          g.destroy();
        }
      },
    });
    rings.set(e, { g, tw, last: now });
  };
  return {
    update() {
      const now = fx.scene.time.now;
      for (const e of enemies.all) {
        if (!e.active) continue;
        const r = rings.get(e);
        if (r) r.g.setPosition(e.x, e.y); // the ring follows the walking Ward
        if (e.def.ignoresControl !== true || !e.deny) continue;
        e.deny = false;
        bloom(e, now);
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
