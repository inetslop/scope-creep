import type { AugmentDef } from '../types';

/** The needles a lone Spray's shot splits into; each extra Spray adds one more. */
export const SPRAY_NEEDLES = 3;

export const spray: AugmentDef = {
  id: 'spray',
  name: 'Spray',
  description: 'Fires a shot that splits into 3 homing needles on hit. Added: +1 needle per split per extra Spray.',
  asTower: 'Fires a shot that splits into 3 homing needles on hit.',
  asAdded: '+1 needle per split per extra Spray.',
  look: { shape: 'diamond', color: 'yellow', size: 0.24 },
  first: { kind: 'spray', damage: 12, range: 4, rate: 1 / 1.1, spray: SPRAY_NEEDLES },
  added: { spray: 1 },
  tiers: {
    rare: { damageMul: 7 / 6, cooldownMul: 0.95 / 1.1, asAdded: '+1 needle per split per extra Spray.' },
    epic: { damageMul: 4 / 3, cooldownMul: 0.8 / 1.1, asAdded: '+1 needle per split per extra Spray.' },
  },
};
