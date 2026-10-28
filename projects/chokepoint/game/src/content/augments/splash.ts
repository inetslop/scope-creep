import type { AugmentDef } from '../types';

export const splash: AugmentDef = {
  id: 'splash',
  name: 'Splash',
  description: 'Blasts everything around it. Added: hits burst over 1 cell.',
  asTower: 'Blasts everything around it.',
  asAdded: 'Hits burst over 1 cell.',
  look: { shape: 'hexagon', color: 'blue', size: 0.24 },
  first: { kind: 'pulse', damage: 15, range: 1.7, rate: 1 },
  added: { splash: 1 },
};
