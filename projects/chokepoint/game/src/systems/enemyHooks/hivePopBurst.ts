import { PALETTE } from '../../content/palette';
import { popsDue } from '../../core/hivePops';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The Hive's popped Dot landing (T0366): the moment a telegraphed Dot actually spawns — one
 * every `everySec` at the Hive's spot, up to `max` (systems/enemyHooks/hivePops.ts) — one small
 * 4-chip burst in the Hive's own purple (the boss's body color) plays at the pop spot, over
 * ~0.3 s, fading out. The thin telegraph ring still warns first, in its own file: two beats,
 * warning then event, at the same spot. This hook ticks the same pop clock as hivePops — one
 * per live Hive, fresh on a recycled slot — so each due pop fires exactly one burst at the
 * Hive's spot; the pop, the telegraph and the popped Dot's numbers stay exactly as they are.
 * Display only: no sound, no text, no HUD.
 */
export const hivePopBurst: MakeEnemyHook = ({ fx, enemies }) => {
  // One state per live hive: its spawn's serial (the pool reuses objects) and its own clock,
  // ticking in step with hivePops's: kept in the closure, never module-level (a new run makes
  // a new hook).
  const hives = new Map<Enemy, { serial: number; clock: number; pops: number }>();
  return {
    update(dt) {
      for (const e of enemies.all) {
        if (!e.active) { hives.delete(e); continue; } // a dead hive pops no more
        const rule = e.def.pops;
        if (rule === undefined) continue; // never any other enemy or boss: only the Hive pops
        let h = hives.get(e);
        if (h === undefined || h.serial !== e.serial) { h = { serial: e.serial, clock: 0, pops: 0 }; hives.set(e, h); } // a recycled slot starts its clock fresh
        h.clock += dt;
        const due = popsDue(h.clock, rule);
        while (h.pops < due) {
          h.pops += 1;
          fx.burst(e.x, e.y, PALETTE[e.def.look.color], 4); // the Dot arriving: the Hive's own color, at its spot
        }
      }
    },
  };
};
