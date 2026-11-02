import { CELL } from '../../config';
import { getEnemy } from '../../content/enemies';
import { PALETTE } from '../../content/palette';
import { nextPopAt, popsDue } from '../../core/hivePops';
import { waveHpMul } from '../../core/waves';
import type { Enemy } from '../../entities/Enemy';
import { auraRing } from '../fx/auraRing';
import type { MakeEnemyHook } from './hook';

/**
 * The Hive's pop: while it walks, its own clock pops one Dot at its spot every `everySec` — up
 * to `max`, the first `everySec` after its own spawn. Each pop is telegraphed a beat early by one
 * thin ring in the Hive's own color at its base (the working-aura ring), then the Dot pops in
 * with its ordinary spawn pop plus a small ring at its spot. A popped Dot is a real spawn: it
 * takes the wave's and the level's hp like a plan spawn and is an ordinary enemy in every way.
 * The popping stops the instant the Hive dies. The Dots a live Hive will still pop ride in
 * `run.pendingPops`, rewritten every wave frame, so the enemies-left count keeps them in.
 */
export const hivePops: MakeEnemyHook = ({ enemies, fx, run }) => {
  // One state per live hive: its spawn's serial (the pool reuses objects), its own clock, how
  // many it has popped, and whether the next pop's telegraph has bloomed. Kept in the closure,
  // never module-level: a new run makes a new hook.
  const hives = new Map<Enemy, { serial: number; clock: number; pops: number; telegraphed: boolean }>();
  return {
    update(dt) {
      let pending = 0; // the Dots the live hives will still pop; rewritten every wave frame
      for (const e of enemies.all) {
        if (!e.active) { hives.delete(e); continue; } // the slot is free (or a recycled one): prune it, a dead hive pops no more
        const rule = e.def.pops;
        if (rule === undefined) continue;
        let h = hives.get(e);
        if (h === undefined || h.serial !== e.serial) { h = { serial: e.serial, clock: 0, pops: 0, telegraphed: false }; hives.set(e, h); } // a recycled slot starts its clock fresh
        h.clock += dt; // its own clock, even slowed or rooted: the popping stops only when it dies
        const due = popsDue(h.clock, rule);
        const at = nextPopAt(h.clock, rule);
        if (!h.telegraphed && at >= 0 && h.clock >= at - rule.telegraphSec) {
          h.telegraphed = true;
          auraRing(fx, e.x, e.y, PALETTE[e.def.look.color]); // the working-aura ring, once, in the Hive's own color
        }
        const x = e.x, y = e.y, d = e.distance; // captured before the loop: the spawn recycles a free slot, never the live hive
        while (h.pops < due) {
          h.pops += 1;
          const into = getEnemy(rule.into);
          enemies.spawn(into, waveHpMul(run.wave) * run.levelHpMul, e.speedMul, e.waveSpeedMul, e.walkMul, d); // the run's Tough, exactly like a plan spawn
          fx.ring(x, y, into.look.size * CELL, PALETTE[into.look.color]); // a small ring at its spot, in the Dot's color
          h.telegraphed = false; // the next pop telegraphs on its own
        }
        pending += rule.max - h.pops;
      }
      run.pendingPops = pending; // 0 when no hive is alive
    },
  };
};
