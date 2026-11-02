import { blinkRing } from '../fx/blinkRing';
import type { MakeEnemyHook } from './hook';

/**
 * The Blinker's committed telegraph: the frame its leg turns to 'tele', one thin ring in its own
 * pink blooms at the destination (systems/fx/blinkRing.ts) — where the blink will land, control
 * or no control. The ring is the telegraph's whole language: the eye's slide plays on the token
 * itself (entities/Enemy.ts), and this fires the ring once per telegraph.
 */
export const blinkTelegraph: MakeEnemyHook = ({ enemies, fx }) => ({
  update() {
    for (const e of enemies.all) {
      if (!e.active || !e.blinkTold) continue;
      e.blinkTold = false;
      const p = e.path.pointAt(e.blinkDest);
      blinkRing(fx, p.x, p.y);
    }
  },
});
