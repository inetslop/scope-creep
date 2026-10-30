import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import { outOfReachLeg } from '../../core/outOfReach';
import type { Enemy } from '../../entities/Enemy';
import { fillRing } from '../../ui/ring';
import type { MakeEnemyHook } from './hook';

/** The ring's stroke and its resting alpha (the dim, un-swept full circle). */
const W = 2;
const DIM = 0.25;

/**
 * The Colossus's phase wind-up: while the boss is at half health or below, a thin ring in the
 * boss's own color sits on the road under its token, at ground level, and sweeps 0°→360°
 * clockwise over its full 8 s between phases — the Push wind-up's sweep in the Mute ring's
 * ground placement — so the next beat is readable before it lands. The sweep completes as the
 * white telegraph flashes; for the 2.5 s out-of-reach beat the ring rests, a dim un-swept full
 * circle, and resumes a fresh sweep when the boss returns.
 *
 * Driven by the boss's own phase clock (`reachClock`, the simulation dt): at 2× speed it
 * sweeps in half the real time, staying true to the beat. No sound, no HUD, no card change:
 * this is a wind-up, not a status chip — the boss card and the phase note stay as they are.
 */
export const bossPhase: MakeEnemyHook = ({ fx, enemies }) => {
  const rings = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = rings.get(e);
    if (!g) return;
    rings.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        const spec = e.def.outOfReach;
        if (!e.active || spec === undefined || e.reachClock < 0) { drop(e); continue; }
        let g = rings.get(e);
        if (!g) { g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y); rings.set(e, g); }
        g.setPosition(e.x, e.y);
        const t = e.reachClock % spec.periodSec;
        const leg = outOfReachLeg(spec, e.reachClock);
        const r = e.def.look.size * CELL; // the Colossus's token radius
        g.clear();
        if (leg === 'out') fillRing(g, 0, 0, r * 1.5, W, 0, Math.PI * 2, PALETTE[e.def.look.color], DIM);
        else if (leg === 'flash') fillRing(g, 0, 0, r * 1.5, W, 0, Math.PI * 2, PALETTE[e.def.look.color], 1);
        else {
          const p = (t - spec.telegraphSec - spec.phaseSec) / (spec.periodSec - spec.telegraphSec - spec.phaseSec);
          if (p > 0) fillRing(g, 0, 0, r * 1.5, W, 0, p * Math.PI * 2, PALETTE[e.def.look.color], 1);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
