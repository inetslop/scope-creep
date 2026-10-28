import type { AugmentDef } from '../types';

export const push: AugmentDef = {
  id: 'push',
  name: 'Push',
  description: 'Pushes everything back along the road. Added: hits push back 0.4 cells.',
  asTower: 'Pushes everything back 0.8 cells, every 2.4 s.',
  asAdded: 'Hits push back 0.4 cells, +0.4 per Push.',
  look: { shape: 'triangle', color: 'purple', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 2.4, push: 0.8 },
  added: { push: 0.4 },
  opening: true,
  tiers: {
    rare: { cooldownMul: 5 / 6, push: 1.0, asTower: 'Pushes everything back 1.0 cells, every 2.0 s.', asAdded: 'Hits push back 0.4 cells, +0.4 per Push.' },
    epic: { cooldownMul: 3 / 4, push: 1.2, asTower: 'Pushes everything back 1.2 cells, every 1.8 s.', asAdded: 'Hits push back 0.4 cells, +0.4 per Push.' },
  },
};
