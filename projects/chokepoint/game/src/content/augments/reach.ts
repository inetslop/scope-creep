import type { AugmentDef } from '../types';

export const reach: AugmentDef = {
  id: 'reach',
  name: 'Reach',
  description: 'A sniper: long range, slow, heavy shots. Added: 35% more range.',
  asTower: 'A sniper: long range, slow, heavy shots.',
  asAdded: '35% more range.',
  look: { shape: 'pentagon', color: 'green', size: 0.22 },
  first: { kind: 'shot', damage: 42, range: 4.6, rate: 0.45, projectileSpeed: 22 },
  added: { rangeMul: 1.35 },
  tiers: {
    rare: { damageMul: 1.3, cooldownMul: 0.85, rangeMul: 1.15, addedRangeMul: 1.45, asAdded: '45% more range.' },
    epic: { damageMul: 1.7, cooldownMul: 0.7, rangeMul: 1.35, addedRangeMul: 1.55, asAdded: '55% more range.' },
  },
};
