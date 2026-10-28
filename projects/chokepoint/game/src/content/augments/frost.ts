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
  tiers: {
    rare: { cooldownMul: 0.85, slowPct: 0.5, asAdded: 'Hits slow enemies by 50%.' },
    epic: { cooldownMul: 0.7, slowPct: 0.6, asAdded: 'Hits slow enemies by 60%.' },
  },
};
