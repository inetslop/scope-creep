import { PALETTE } from '../palette';
import type { WeaponDef } from '../types';

/** Unlocked by the Arc upgrade: a jagged ink bolt that snaps toward your aim and chains between nearby enemies. */
export const arc: WeaponDef = {
  id: 'arc',
  name: 'Arc',
  description: 'A jagged ink bolt that snaps toward your aim and chains between nearby enemies.',
  fireRate: 1 / 0.9, // one arc every 0.9 s
  count: 1,
  spreadDeg: 0,
  jitterDeg: 0, // projectile fields unused for arc weapons, required by the type
  damage: 16,
  speed: 0,
  lifetimeSec: 0,
  pierce: 0,
  knockback: 40,
  look: {
    length: 4,
    width: 4,
    color: PALETTE.ink,
  },
  arc: { range: 260, coneDeg: 30, maxJumps: 3, chainRadius: 140, fadeMs: 200 },
};
