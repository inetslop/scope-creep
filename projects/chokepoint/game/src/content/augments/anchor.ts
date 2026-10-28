import type { AugmentDef } from '../types';

/** Each Anchor copy after the first in a tower lengthens every root it applies by this many seconds. */
export const ANCHOR_EXTRA_ROOT_SEC = 0.25;

/**
 * The full stop: its pulse roots everything around it (they do not move until it wears off), and
 * added to any tower its hits root the enemy briefly. A rooted enemy can still be hit and killed.
 * After a root wears off the enemy shrugs off roots for a while (core/root.ts), so no tower holds
 * it for good. It only ever rolls as an Epic card, with the base values: Anchor added to Splash
 * roots everything around it, too strong to come often.
 */
export const anchor: AugmentDef = {
  id: 'anchor',
  name: 'Anchor',
  description: 'Roots everything around it. Added: hits root enemies.',
  asTower: 'Roots everything within 2.5 cells for 0.75s, every 3s.',
  asAdded: 'Hits root for 0.5s (+0.25s per extra Anchor).',
  look: { shape: 'square', color: 'pink', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 3, root: { sec: 0.75 } },
  added: { root: { sec: 0.5 } },
  tier: 'epic',
  // Anchor only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Hits root for 0.5s (+0.25s per extra Anchor).' },
    epic: { asAdded: 'Hits root for 0.5s (+0.25s per extra Anchor).' },
  },
};
