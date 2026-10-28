import type { AugmentDef } from '../types';

export const bolt: AugmentDef = {
  id: 'bolt',
  name: 'Bolt',
  description: 'Shoots the enemy furthest along. Added: one more shot each attack.',
  asTower: 'Shoots the enemy furthest along.',
  asAdded: 'One more shot each attack.',
  look: { shape: 'circle', color: 'teal', size: 0.21 },
  first: { kind: 'shot', damage: 12, range: 2.6, rate: 1.6, projectileSpeed: 10 },
  added: { extraShots: 1 },
};
