import type { AugmentDef } from '../types';

/** The pellets a lone Spray's blast fires; each added Spray adds two more. */
export const SPRAY_PELLETS = 5;

export const spray: AugmentDef = {
  id: 'spray',
  name: 'Spray',
  description: 'Blasts 5 pellets in a cone: deadly up close. Added: +2 pellets per blast.',
  asTower: 'Blasts 5 pellets in a cone: deadly up close.',
  asAdded: '+2 pellets per blast.',
  look: { shape: 'diamond', color: 'yellow', size: 0.24 },
  first: { kind: 'spray', damage: 4, range: 2.5, rate: 1 / 1.2, spray: SPRAY_PELLETS },
  added: { spray: 2 },
  tiers: {
    rare: { damageMul: 5 / 4, cooldownMul: 1.05 / 1.2, asAdded: '+2 pellets per blast.' },
    epic: { damageMul: 6 / 4, cooldownMul: 0.9 / 1.2, asAdded: '+2 pellets per blast.' },
  },
};
