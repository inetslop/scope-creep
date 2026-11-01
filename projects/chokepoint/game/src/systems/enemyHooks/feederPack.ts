import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import { fillRing } from '../../ui/ring';
import type { MakeEnemyHook } from './hook';

/** Cells of pack a Feeder pushes: everything with its center this close walks a quarter faster. */
const REACH = 2;
/** The push: a quarter more pace, never more — two Feeders overlap to one push, not two. */
const PACK_PCT = 0.25;
/** The pulse's beat and life, in real milliseconds (scene.time, not the simulation dt). */
const BEAT_MS = 1200;

/**
 * The Feeder's push: while a Feeder is alive, every enemy whose center is inside its two-cell
 * circle — the Feeder itself included — walks a quarter faster. Sets `packPct` on each enemy
 * (entities/Enemy.ts); advance() multiplies it on after the slow and the haste, so a Sprinter
 * inside keeps its hit ramp on top and a slowed enemy walks 0.75 × 1.25 of base. The value is
 * 0 or a quarter, so at most one Feeder's push ever applies to an enemy.
 *
 * The working sign: while a Feeder lives, a quiet ring in the Feeder's own orange at the soft
 * working-aura alpha pulses from its token out to the full reach once every 1.2 s and fades over
 * 1.2 s, at ground level under the token (the Mute's ring, systems/enemyHooks/muteJam.ts). It is
 * a draw, not a simulation timer: the beat and the fade run on scene.time, so they read the same
 * at 1x and 2x. The ring is gone the frame the Feeder dies.
 */
export const feederPack: MakeEnemyHook = ({ enemies, scene }) => {
  /** Real ms of the last pulse; 0 so the first wave frame pulses straight away. */
  let lastPulse = 0;
  /** One live ring per Feeder: its Graphics and its tween, followed every frame, cleared on death. */
  const rings = new Map<Enemy, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween }>();
  const drop = (e: Enemy) => {
    const r = rings.get(e);
    if (!r) return;
    rings.delete(e);
    r.tw.remove();
    r.g.destroy();
  };
  return {
    update() {
      const feeders = enemies.all.filter((e) => e.active && e.def.id === 'feeder');
      const r2 = REACH * REACH * CELL * CELL;
      for (const e of enemies.all) {
        if (!e.active) continue;
        e.packPct = feeders.some((f) => (f.x - e.x) ** 2 + (f.y - e.y) ** 2 <= r2) ? PACK_PCT : 0;
      }
      // The rings follow their Feeders (the Feeder walks; the ring stays on it).
      for (const [f, r] of rings) r.g.setPosition(f.x, f.y);
      // The quiet pulse: once every 1.2 s of real time, each Feeder that still lives.
      const now = scene.time.now;
      if (now - lastPulse >= BEAT_MS) {
        lastPulse = now;
        for (const f of feeders) {
          drop(f); // the last pulse is fading out; a no-op once it has faded
          const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(f.x, f.y);
          fillRing(g, 0, 0, REACH * CELL, 3, 0, Math.PI * 2, PALETTE.orange, 0.4);
          g.setScale((0.26 * CELL) / (REACH * CELL)); // from the Feeder's token (look.size, content/enemies/feeder.ts)
          const tw = scene.tweens.add({
            targets: g, scale: 1, alpha: 0, duration: BEAT_MS, ease: 'Quad.easeOut',
            onComplete: () => {
              const r = rings.get(f);
              if (r && r.g === g) {
                rings.delete(f);
                g.destroy();
              }
            },
          });
          rings.set(f, { g, tw });
        }
      }
    },
    onKill({ enemy }) {
      drop(enemy); // gone the frame it dies, even mid-pulse
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};
