import type { AugmentDef } from '../types';

/**
 * The predictive shot: it flies to where the enemy is going, not where it is. The lead is the
 * shot's travel time times the enemy's current speed (a ramped Sprinter is led more, a slowed one
 * less), capped at 1.2 cells plus 0.6 per extra Lead in the tower; past the cap the shot lands
 * ahead and fizzles, so stacking Lead is the answer against fast enemies.
 */
export const lead: AugmentDef = {
  id: 'lead',
  name: 'Lead',
  description: 'Aims where the enemy will be: heavy shot. Added: shots lead +0.6 cells per extra Lead.',
  asTower: 'Aims where the enemy will be: heavy shot.',
  asAdded: 'Shots lead +0.6 cells per extra Lead.',
  look: { shape: 'chevron', color: 'green', size: 0.22 },
  first: { kind: 'shot', damage: 16, range: 4.5, rate: 1 / 1.2, projectileSpeed: 8, lead: 1.2 },
  added: { lead: 0.6 },
  tiers: {
    rare: { damageMul: 20 / 16, cooldownMul: 0.875, asTower: 'Aims where the enemy will be: 20-damage heavy shot.', asAdded: 'Shots lead +0.6 cells per extra Lead.' },
    epic: { damageMul: 24 / 16, cooldownMul: 0.75, asTower: 'Aims where the enemy will be: 24-damage heavy shot.', asAdded: 'Shots lead +0.6 cells per extra Lead.' },
  },
};
