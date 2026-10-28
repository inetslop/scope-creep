import type { AugmentDef } from '../types';

/**
 * The piercing shot: a long thin tracer that keeps going after a hit, striking the enemies in a
 * line behind it. Added to a tower, it lets that tower's shots pass through one more enemy.
 */
export const lance: AugmentDef = {
  id: 'lance',
  name: 'Lance',
  description: 'A long thin shot that keeps going. Added: +1 pierce.',
  asTower: 'A long thin shot: 12 damage every 0.9s, hits one beyond.',
  asAdded: '+1 pierce.',
  look: { shape: 'square', color: 'teal', size: 0.22 },
  first: { kind: 'shot', damage: 12, range: 2.6, rate: 1.11, projectileSpeed: 10, pierce: 1 },
  added: { pierce: 1 },
  tiers: {
    rare: { damageMul: 16 / 12, cooldownMul: 1.11 / 1.3, pierce: 2, asAdded: '+1 pierce.' },
    epic: { damageMul: 20 / 12, cooldownMul: 1.11 / 1.59, pierce: 3, asAdded: '+1 pierce.' },
  },
};
