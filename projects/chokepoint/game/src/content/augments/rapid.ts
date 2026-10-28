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
  tiers: {
    rare: { damageMul: 1.3, cooldownMul: 0.85, addedRateMul: 1.65, asAdded: 'Attacks 65% faster, hits 25% lighter.' },
    epic: { damageMul: 1.7, cooldownMul: 0.7, addedRateMul: 1.85, asAdded: 'Attacks 85% faster, hits 25% lighter.' },
  },
};
