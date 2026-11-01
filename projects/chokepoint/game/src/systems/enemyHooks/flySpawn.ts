import type { Enemy } from '../../entities/Enemy';
import { flyRing } from '../fx/flyRing';
import type { MakeEnemyHook } from './hook';

/** The Flyer's tell: the moment it spawns, one thin purple ring at its entry point on the edge (systems/fx/flyRing.ts). */
export const flySpawn: MakeEnemyHook = ({ enemies, fx }) => {
  // The pool is reused: a new serial on a pooled enemy is a new spawn (the same mark as nameTag's).
  const spawnSerial = new WeakMap<Enemy, number>();
  return {
    update(_dt: number) {
      for (const e of enemies.all) {
        if (!e.active || spawnSerial.get(e) === e.serial) continue;
        spawnSerial.set(e, e.serial);
        if (e.def.id !== 'flyer') continue;
        flyRing(fx, e.x, e.y);
      }
    },
  };
};
