import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import { fillRing } from '../../ui/ring';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach Rally's range ring shows. */
const MUTE_REACH = 2;
/** The pulse's beat and life, in real milliseconds (scene.time, not the simulation dt). */
const BEAT_MS = 1000;

/**
 * The Mute's silence: while a Mute is alive, every tower whose center is inside its two-cell
 * circle holds still. Sets `jammed` on each tower (entities/Tower.ts); TowerSystem skips jammed
 * towers, so no shot, gust, root, burn or tick leaves them, and the Push windup (its ring reads
 * the tower's own cooldown) freezes and resumes with it.
 *
 * The working sign: while a Mute holds at least one tower still, a thin ring in the Mute's own
 * purple pulses from its token out to the full reach once a second and fades over 1 s, at ground
 * level under the token in the working aura's soft alpha (systems/fx/auraRing.ts). It is a draw,
 * not a simulation timer: the beat and the fade run on scene.time, so they read the same at 1x
 * and 2x. The ring is gone the frame the Mute dies.
 */
export const muteJam: MakeEnemyHook = ({ enemies, towers, scene }) => {
  /** Real ms of the last pulse; 0 so the first holding frame pulses straight away. */
  let lastPulse = 0;
  /** One live ring per Mute: its Graphics and its tween, followed every frame, cleared on death. */
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
      const mutes = enemies.all.filter((e) => e.active && e.def.id === 'mute');
      const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
      for (const t of towers()) t.setJammed(mutes.some((m) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2));
      // The rings follow their Mutes (the Mute walks; the ring stays on it).
      for (const [m, r] of rings) r.g.setPosition(m.x, m.y);
      // The quiet pulse: once a second of real time, each Mute that holds at least one tower still.
      const now = scene.time.now;
      if (now - lastPulse >= BEAT_MS) {
        lastPulse = now;
        for (const m of mutes) {
          if (!towers().some((t) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2)) continue;
          drop(m); // the last pulse is fading out; a no-op once it has faded
          const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(m.x, m.y);
          fillRing(g, 0, 0, MUTE_REACH * CELL, 3, 0, Math.PI * 2, PALETTE.purple, 0.9);
          g.setScale((0.26 * CELL) / (MUTE_REACH * CELL)); // from the Mute's token (look.size, content/enemies/mute.ts)
          const tw = scene.tweens.add({
            targets: g, scale: 1, alpha: 0, duration: BEAT_MS, ease: 'Quad.easeOut',
            onComplete: () => {
              const r = rings.get(m);
              if (r && r.g === g) {
                rings.delete(m);
                g.destroy();
              }
            },
          });
          rings.set(m, { g, tw });
        }
      }
    },
    onKill({ enemy }) {
      drop(enemy); // gone the frame it dies, even mid-pulse (as the root's tick is)
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};
