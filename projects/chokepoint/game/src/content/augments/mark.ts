import type { AugmentDef } from '../types';

/**
 * The rule changer: it only ever rolls as an Epic card (`tier: 'epic'` limits it to Epic in the
 * draft), and it may open a run despite dealing no damage. The mark it puts on an enemy raises
 * the damage that enemy takes from everything, until it dies.
 */
export const mark: AugmentDef = {
  id: 'mark',
  name: 'Mark',
  description: 'Marks the enemy furthest along: it takes more damage from everything. Added: hits apply the mark.',
  asTower: 'Marks the enemy furthest along: +25% damage from all.',
  asAdded: 'Hits apply the mark, +25% per Mark.',
  look: { shape: 'square', color: 'pink', size: 0.22 },
  first: { kind: 'mark', damage: 0, range: 3, rate: 1 / 1.2, mark: 0.25 },
  added: { mark: 0.25 },
  tier: 'epic',
  opening: true,
  // Mark only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Hits apply the mark, +25% per Mark.' },
    epic: { asAdded: 'Hits apply the mark, +25% per Mark.' },
  },
};
