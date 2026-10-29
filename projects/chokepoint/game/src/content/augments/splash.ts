import type { AugmentDef } from '../types';

/** How many enemies one copy of Splash lets a hit strike: the cap on its blast and bursts. */
export const SPLASH_CAP = 3;

export const splash: AugmentDef = {
  id: 'splash',
  name: 'Splash',
  description: `Blasts the ${SPLASH_CAP} furthest around it. Added: hits burst over 1 cell, to ${SPLASH_CAP - 1} more enemies.`,
  asTower: `Blasts the ${SPLASH_CAP} furthest around it.`,
  asAdded: `Hits burst over 1 cell, to ${SPLASH_CAP - 1} more enemies.`,
  look: { shape: 'hexagon', color: 'blue', size: 0.24 },
  first: { kind: 'pulse', damage: 15, range: 1.7, rate: 1 },
  added: { splash: 1 },
  tiers: {
    rare: { damageMul: 1.3, cooldownMul: 0.85, splash: 1.5, asAdded: `Hits burst over 1.5 cells, to ${SPLASH_CAP - 1} more enemies.` },
    epic: { damageMul: 1.7, cooldownMul: 0.7, splash: 2, asAdded: `Hits burst over 2 cells, to ${SPLASH_CAP - 1} more enemies.` },
  },
};
