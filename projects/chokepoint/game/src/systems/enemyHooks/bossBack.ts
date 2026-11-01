import { outOfReachLeg } from '../../core/outOfReach';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's return from its out-of-reach beat (the Colossus, core/outOfReach.ts): the frame its
 * 2.5 s untargetable phase ends and the towers can hit it again, its token flashes white — the
 * telegraph's own white (Enemy's `setTintFill(0xffffff)`) — for 0.3 s, once per return, the first
 * included. Display only: the wind-up ring (bossPhase) already counts the next beat and the quiet
 * tone (bossOut) already marks the departure; this marks the return. No sound, text, chip or ring.
 * The flash rides the boss's own beat clock (`reachClock`, the simulation dt), so at 2× speed it
 * lasts half the real time and a resumed run flashes at its next return, once. An enemy with no
 * outOfReach spec is byte-identical.
 */
const BACK = 0.3;

export const bossBack: MakeEnemyHook = ({ enemies }) => {
  /** The enemies this hook tinted last frame: its clear only undoes its own tint. */
  const lit = new WeakMap<Enemy, boolean>();
  return {
    update() {
      for (const e of enemies.all) {
        const spec = e.def.outOfReach;
        if (!e.active || spec === undefined || e.reachClock < 0) continue;
        // Seconds since the out-of-reach phase ended; -1 while the telegraph or the phase runs
        // (that white, if any, is the beat's own, owned by Enemy's advance).
        const back = outOfReachLeg(spec, e.reachClock) === 'idle'
          ? e.reachClock % spec.periodSec - spec.telegraphSec - spec.phaseSec
          : -1;
        const want = back >= 0 && back < BACK;
        if (want) e.setTintFill(0xffffff); // re-asserted every frame; setTintFill is idempotent
        else if (lit.get(e)) e.clearTint();
        lit.set(e, want);
      }
    },
  };
};
