import { outOfReachLeg } from '../../core/outOfReach';
import type { OutOfReachLeg } from '../../core/outOfReach';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's out-of-reach: the frame its white telegraph flash ends and it goes out of reach,
 * one quiet note plays - the start of its 2.5 s untargetable beat (core/outOfReach.ts). One
 * note per 8 s beat; the return to targetable is silent; an enemy with no outOfReach spec is
 * byte-identical.
 */
export const bossOut: MakeEnemyHook = ({ enemies, sfx }) => {
  const prevLeg = new WeakMap<Enemy, OutOfReachLeg>();
  return {
    update() {
      for (const e of enemies.all) {
        if (!e.active || e.def.outOfReach === undefined || e.reachClock < 0) continue;
        const now = outOfReachLeg(e.def.outOfReach, e.reachClock);
        const prev = prevLeg.get(e);
        if (prev === 'flash' && now === 'out') sfx?.bossOut();
        if (now !== prev) prevLeg.set(e, now);
      }
    },
  };
};
