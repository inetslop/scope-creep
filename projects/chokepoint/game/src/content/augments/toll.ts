import type { AugmentDef } from '../types';

/**
 * The toll: while a Toll tower stands, every enemy that reaches the exit pays gold on top of its
 * life cost — income from what the run loses. It only ever rolls as an Epic card (`tier: 'epic'`
 * limits it to Epic in the draft), and it may not open a run: it deals no damage to hold wave 1.
 */
export const toll: AugmentDef = {
  id: 'toll',
  name: 'Toll',
  description: 'Every leak pays +2 gold while a Toll tower stands. Added: +1 more per leak.',
  asTower: 'While a Toll tower stands, every leak pays +2 gold.',
  asAdded: 'Each extra Toll: +1 more gold per leak.',
  look: { shape: 'circle', color: 'yellow', size: 0.2 },
  first: { kind: 'pulse', damage: 0, range: 1, rate: 1, goldPerLeak: 2 },
  added: { goldPerLeak: 1 },
  tier: 'epic',
  // Toll only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Each extra Toll: +1 more gold per leak.' },
    epic: { asAdded: 'Each extra Toll: +1 more gold per leak.' },
  },
};
