import { CELL } from '../../config';
import { PALETTE } from '../../content/palette';
import { mendsDue, nextMendAt } from '../../core/mendClock';
import type { Enemy } from '../../entities/Enemy';
import { mendRing } from '../fx/mendRing';
import type { MakeEnemyHook } from './hook';

/**
 * The Mender's mend: on its own clock, every `everySec` after its spawn — up to `count` — a thin
 * ring in its own orange contracts from `radius` cells in to the token, then it and each living
 * Ward within `radius` cells flash white and restore `frac` of their own max hp. A mend never
 * revives: a killed Ward is simply not in the loop, and a Ward a gust pushed past the radius is
 * missed. The mending lands on its clock even while the Mender is slowed or rooted; the Wards
 * ignore control on their own, and the mending stops the instant the Mender dies.
 */
export const mendPack: MakeEnemyHook = ({ enemies, fx }) => {
  // One state per live mender: its spawn's serial (the pool reuses objects), its own clock, how
  // many mends have landed, and whether the next mend's telegraph has closed in. Kept in the
  // closure, never module-level: a new run makes a new hook.
  const menders = new Map<Enemy, { serial: number; clock: number; landed: number; ringed: boolean }>();
  return {
    update(dt) {
      for (const e of enemies.all) {
        if (!e.active) { menders.delete(e); continue; } // the slot is free (or a recycled one): prune it, a dead mender mends no more
        const rule = e.def.mends;
        if (rule === undefined) continue;
        let m = menders.get(e);
        if (m === undefined || m.serial !== e.serial) { m = { serial: e.serial, clock: 0, landed: 0, ringed: false }; menders.set(e, m); } // a recycled slot starts its clock fresh
        m.clock += dt; // its own clock, even slowed or rooted: the mending stops only when it dies
        const at = nextMendAt(m.clock, rule);
        if (!m.ringed && at >= 0 && m.clock >= at - rule.telegraphSec) {
          m.ringed = true;
          mendRing(fx, e.x, e.y, rule.radius, e.def.look.size * CELL, PALETTE[e.def.look.color]); // the closing ring, once, in the Mender's own orange
        }
        const x = e.x, y = e.y; // captured before the loop: the mender's spot the escorts are measured from
        while (m.landed < mendsDue(m.clock, rule)) {
          m.landed += 1;
          m.ringed = false; // the next mend telegraphs on its own
          const mend = (o: Enemy): void => { o.flash = 0.06; o.setTintFill(0xffffff); o.hp = Math.min(o.maxHp, o.hp + o.maxHp * rule.frac); }; // the hit flash, turned into a heal
          mend(e);
          for (const o of enemies.all) {
            if (o.active && o.def.id === rule.escortId && Math.hypot(o.x - x, o.y - y) <= rule.radius * CELL) mend(o);
          }
        }
      }
    },
  };
};
