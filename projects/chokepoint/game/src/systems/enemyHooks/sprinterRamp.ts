import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/** The notch's scale-in / fade-out (scene ms); the hold sits between them. */
const IN_MS = 150;
const HOLD_MS = 100;
const OUT_MS = 150;

/**
 * The Sprinter's ramp notch: the moment a hit raises its speed (the existing ramp rule in
 * Enemy.hit(), whatever source counts) one small notch in its own orange pops at the
 * chevron's base: scales in 150 ms, holds 100 ms, fades 150 ms, about a third of the token's
 * wide. Re-derived every frame from the enemy's current speed, so an enemy's first sight — a
 * spawn, or a resumed run's mid-ramp Sprinter — sets its baseline silently. One notch at a
 * time per Sprinter: a new rise restarts it from the top. At the cap the speed never rises,
 * so a capped Sprinter shows none. Ground level under the token (DEPTH.preview); rides it.
 * Display only: ramp rule, white hit flash, numbers and wave mix stay as they are.
 */
export const sprinterRamp: MakeEnemyHook = ({ scene, enemies }) => {
  /** Per-enemy: last speed seen (board units/s), and the live notch while one plays. */
  const seen = new Map<Enemy, { last: number; g?: Phaser.GameObjects.Graphics; tin?: Phaser.Tweens.Tween; tout?: Phaser.Tweens.Tween }>();
  const drop = (e: Enemy): void => {
    const s = seen.get(e);
    if (!s) return;
    seen.delete(e);
    if (!s.g) return;
    s.tin?.remove();
    s.tout?.remove();
    s.g.destroy();
  };
  const pop = (e: Enemy): void => {
    const s = seen.get(e)!;
    if (s.g) {
      s.tin?.remove(); // a new rise restarts it from the top (never stacks)
      s.tout?.remove();
      s.g.destroy();
    }
    const r = e.def.look.size * CELL;
    const w = (2 * r) / 3; // about a third of the token's wide
    const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y).setScale(0);
    g.fillStyle(PALETTE[e.def.look.color], 1);
    g.fillTriangle(-w / 2, r, w / 2, r, 0, r + w); // the wedge at the chevron's base, pointing down
    s.g = g;
    s.tin = scene.tweens.add({ targets: g, scale: 1, duration: IN_MS, ease: 'Quad.easeOut' });
    s.tout = scene.tweens.add({
      targets: g,
      alpha: 0,
      delay: IN_MS + HOLD_MS,
      duration: OUT_MS,
      ease: 'Quad.easeIn',
      onComplete: (): void => {
        const cur = seen.get(e);
        if (cur && cur.g === g) drop(e);
      },
    });
  };
  return {
    update() {
      for (const e of [...seen.keys()]) if (!e.active) drop(e); // a slot gone: killed, leaked or recycled
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== 'sprinter') continue;
        const s = seen.get(e);
        if (s === undefined) {
          seen.set(e, { last: e.speed }); // first sight: baseline, silent
          continue;
        }
        if (s.g) s.g.setPosition(e.x, e.y); // the notch rides the walking token
        if (e.speed > s.last) {
          s.last = e.speed;
          pop(e);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
