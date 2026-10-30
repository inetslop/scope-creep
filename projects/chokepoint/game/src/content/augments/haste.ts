import type { AugmentDef } from '../types';

/**
 * The first tech-gated augment: it never rolls until the "Haste" pool node is bought (the node's
 * id sits in `tech`, checked against the profile's purchased list at every draft roll). The first
 * aura that works on enemies and towers at once - within 2 cells, towers attack 30% faster and
 * enemies walk 30% faster (applied while inside by systems/HasteSystem.ts), a buff that costs the
 * run tempo as much as it gives. Each extra copy in the tower deepens the aura +15% to both.
 */
export const haste: AugmentDef = {
  id: 'haste',
  name: 'Haste',
  description: 'Towers and enemies within 2 cells run 30% faster. Added: each extra +15% to both.',
  asTower: '2 cells: towers +30% attack, enemies +30% speed.',
  asAdded: 'Each extra Haste: +15% to both.',
  look: { shape: 'ring', color: 'red', size: 0.22 },
  first: { kind: 'rally', damage: 0, range: 2, rate: 1, haste: { pct: 0.3 } },
  added: { haste: { pct: 0.15 } },
  tier: 'epic',
  tech: 'haste',
  // Haste only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Each extra Haste: +15% to both.' },
    epic: { asAdded: 'Each extra Haste: +15% to both.' },
  },
};
