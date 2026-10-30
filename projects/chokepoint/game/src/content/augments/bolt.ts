import type { AugmentDef } from '../types';

export const bolt: AugmentDef = {
  id: 'bolt',
  name: 'Bolt',
  description: 'Shoots the enemy furthest along. Added: one more shot at the same enemy each attack.',
  asTower: 'Shoots the enemy furthest along.',
  asAdded: 'One more shot at the same enemy each attack.',
  look: { shape: 'circle', color: 'teal', size: 0.21 },
  first: { kind: 'shot', damage: 12, range: 2.6, rate: 1.6, projectileSpeed: 10 },
  added: { extraShots: 1 },
  tiers: {
    rare: { damageMul: 1.3, cooldownMul: 0.85, addedShots: 2, asAdded: 'Two more shots each attack.' },
    epic: { damageMul: 1.7, cooldownMul: 0.7, addedShots: 3, asAdded: 'Three more shots each attack.' },
  },
};
