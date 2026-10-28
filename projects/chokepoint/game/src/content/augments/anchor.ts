import type { AugmentDef } from '../types';

/** Each Anchor copy after the first in a tower lengthens every root it applies by this many seconds. */
export const ANCHOR_EXTRA_ROOT_SEC = 0.25;

/**
 * The full stop: its pulse roots everything around it (they do not move until it wears off), and
 * added to any tower its hits root the enemy briefly. A rooted enemy can still be hit and killed.
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
  tiers: {
    rare: { rootSec: 1, addedRootSec: 0.75, asTower: 'Roots everything within 2.5 cells for 1s, every 3s.', asAdded: 'Hits root for 0.75s (+0.25s per extra Anchor).' },
    epic: { rootSec: 1.5, addedRootSec: 1, asTower: 'Roots everything within 2.5 cells for 1.5s, every 3s.', asAdded: 'Hits root for 1s (+0.25s per extra Anchor).' },
  },
};
