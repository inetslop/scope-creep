import type { AugmentDef } from '../types';

export const frost: AugmentDef = {
  id: 'frost',
  name: 'Frost',
  description: 'Slows everything around it. Added: hits slow enemies by 40%.',
  asTower: 'Slows everything around it.',
  asAdded: 'Hits slow enemies by 40%.',
  look: { shape: 'diamond', color: 'ice', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 1.8, rate: 1, slow: { pct: 0.4, sec: 2 } },
  added: { slow: { pct: 0.4, sec: 2 } },
};
