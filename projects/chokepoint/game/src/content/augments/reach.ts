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
};
