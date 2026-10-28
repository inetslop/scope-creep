import type { AugmentDef } from '../types';

/**
 * The first damage over time: it sets ablaze the enemy furthest along, and the burn keeps
 * ticking at its rate after the shot — re-ignition refreshes the 3 s and keeps the higher rate.
 * Its damage is the burn, so the opening draft needs the `opening` flag to offer it.
 */
export const ember: AugmentDef = {
  id: 'ember',
  name: 'Ember',
  description: 'Sets ablaze the enemy furthest along: the burn keeps ticking. Added: hits set ablaze.',
  asTower: 'Sets ablaze the furthest enemy: 3 per second for 3 s.',
  asAdded: 'Hits set ablaze: 3 per second for 3 s.',
  look: { shape: 'circle', color: 'orange', size: 0.2 },
  first: { kind: 'burn', damage: 0, range: 2.6, rate: 1 / 1.5, burn: { dps: 3, sec: 3 } },
  added: { burn: { dps: 3, sec: 3 } },
  opening: true,
  tiers: {
    rare: { burnDps: 4, asTower: 'Sets ablaze the furthest enemy: 4 per second for 3 s.', asAdded: 'Hits set ablaze: 4 per second for 3 s.' },
    epic: { burnDps: 5, asTower: 'Sets ablaze the furthest enemy: 5 per second for 3 s.', asAdded: 'Hits set ablaze: 5 per second for 3 s.' },
  },
};
