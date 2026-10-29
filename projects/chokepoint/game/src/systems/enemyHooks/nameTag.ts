import type { Enemy } from '../../entities/Enemy';
import { nameLabel } from '../fx/nameLabel';
import type { MakeEnemyHook } from './hook';

/** A type's name: the first spawn of an enemy type in a run pops a white name chip above its spot. */
export const nameTag: MakeEnemyHook = ({ enemies, fx }) => {
  const seenTypes = new Set<string>();
  // The pool is reused: a new serial on a pooled enemy is a new spawn (the same mark as burnLeap's).
  const spawnSerial = new WeakMap<Enemy, number>();
  return {
    update(_dt: number) {
      for (const e of enemies.all) {
        if (!e.active || spawnSerial.get(e) === e.serial) continue;
        spawnSerial.set(e, e.serial);
        if (seenTypes.has(e.def.id)) continue;
        seenTypes.add(e.def.id);
        nameLabel(fx, e.x, e.y, e.def.name);
      }
    },
  };
};
