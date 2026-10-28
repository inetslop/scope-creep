import type { AugmentDef } from '../types';

/**
 * The second rule changer: it only ever rolls as an Epic card, and it is the first augment that
 * works on other towers - towers within 2 cells attack 10% faster (flat, never stacks; applied by
 * systems/RallySystem.ts). As a tower's first it does not attack itself; added, it joins its own
 * rally and gains the speed-up too.
 */
export const rally: AugmentDef = {
  id: 'rally',
  name: 'Rally',
  description: 'Towers within 2 cells attack 10% faster. Added: joins its own rally.',
  asTower: 'Towers within 2 cells attack 10% faster. Does not attack itself.',
  asAdded: 'Joins its own rally: this tower also attacks 10% faster.',
  look: { shape: 'pillar', color: 'teal', size: 0.22 },
  first: { kind: 'rally', damage: 0, range: 2, rate: 1 },
  added: { rally: { pct: 0.1 } },
  tier: 'epic',
  // Rally only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Joins its own rally: this tower also attacks 10% faster.' },
    epic: { asAdded: 'Joins its own rally: this tower also attacks 10% faster.' },
  },
};
