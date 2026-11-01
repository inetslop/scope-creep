import type { AugmentDef } from '../types';

/** The pellets a lone Spray's blast fires; a Bolt added to it adds one more. */
export const SPRAY_PELLETS = 5;

export const spray: AugmentDef = {
  id: 'spray',
  name: 'Spray',
  description: 'Blasts 5 pellets in a cone: deadly up close, 15% hit for double. Added: +5% crit on any damage.',
  asTower: 'Blasts 5 pellets in a cone: 15% hit for double.',
  asAdded: '+5% crit chance on any damage.',
  look: { shape: 'diamond', color: 'yellow', size: 0.24 },
  first: { kind: 'spray', damage: 4, range: 2.5, rate: 1 / 1.2, spray: SPRAY_PELLETS },
  added: { crit: 0.05 },
  tiers: {
    rare: { damageMul: 5 / 4, cooldownMul: 1.05 / 1.2, addedCrit: 0.1, asAdded: '+10% crit chance on any damage.' },
    epic: { damageMul: 6 / 4, cooldownMul: 0.9 / 1.2, addedCrit: 0.15, asAdded: '+15% crit chance on any damage.' },
  },
};
