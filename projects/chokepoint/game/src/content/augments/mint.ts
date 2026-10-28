import type { AugmentDef } from '../types';

/**
 * The economy: kills within 2 cells of a Mint tower drop extra gold, so where the towers stand is
 * where the gold comes from. It only ever rolls as an Epic card (`tier: 'epic'` limits it to Epic
 * in the draft), and it may not open a run: it deals no damage to hold wave 1.
 */
export const mint: AugmentDef = {
  id: 'mint',
  name: 'Mint',
  description: 'Kills within 2 cells drop +1 gold. Added: this tower kills drop +1 gold.',
  asTower: 'Kills within 2 cells drop +1 gold. Does not attack.',
  asAdded: "This tower's kills drop +1 gold.",
  look: { shape: 'square', color: 'pink', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 2, rate: 1, goldRadius: 2 },
  added: { goldPerKill: 1 },
  tier: 'epic',
  // Mint only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: "This tower's kills drop +1 gold." },
    epic: { asAdded: "This tower's kills drop +1 gold." },
  },
};
