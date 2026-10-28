import type { AugmentDef } from '../types';

export const rapid: AugmentDef = {
  id: 'rapid',
  name: 'Rapid',
  description: 'Shoots fast, light needles. Added: attacks 50% faster, hits 25% lighter.',
  asTower: 'Shoots fast, light needles.',
  asAdded: 'Attacks 50% faster, hits 25% lighter.',
  look: { shape: 'triangle', color: 'yellow', size: 0.22 },
  first: { kind: 'shot', damage: 5, range: 2.2, rate: 4, projectileSpeed: 14 },
  added: { rateMul: 1.5, damageMul: 0.75 },
};
