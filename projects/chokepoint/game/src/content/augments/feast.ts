import type { AugmentDef } from '../types';

/** The extra seconds one Feast copy beyond the first adds to the kill chain's window (core/feast.ts). */
export const FEAST_WINDOW_EXTRA_SEC = 0.4;

/**
 * Feeding on the kill chain: while the ×N chain lives, every tower deals +4% damage per chain
 * level, off the moment the chain breaks (systems/EnemySystem.ts reads it per hit, core/feast.ts).
 * It only ever rolls as an Epic card (`tier: 'epic'` limits it to Epic in the draft), and it may
 * not open a run: it deals no damage to hold wave 1.
 */
export const feast: AugmentDef = {
  id: 'feast',
  name: 'Feast',
  description: 'While the kill chain lives: every tower +4% damage per chain level. Added: the combo window +0.4 s.',
  asTower: 'Kills chain: every tower +4% damage per chain level.',
  asAdded: 'Each extra Feast: the combo window +0.4 s.',
  look: { shape: 'ring', color: 'yellow', size: 0.22 },
  first: { kind: 'pulse', damage: 0, range: 1, rate: 1, runPower: true },
  added: { chainWindowSec: FEAST_WINDOW_EXTRA_SEC },
  tier: 'epic',
  // Feast only exists as an Epic card; the Epic values are the base values themselves.
  tiers: {
    rare: { asAdded: 'Each extra Feast: the combo window +0.4 s.' },
    epic: { asAdded: 'Each extra Feast: the combo window +0.4 s.' },
  },
};
