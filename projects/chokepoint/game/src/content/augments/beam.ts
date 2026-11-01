import type { AugmentDef } from '../types';

export const beam: AugmentDef = {
  id: 'beam',
  name: 'Beam',
  description: 'A continuous beam on the furthest enemy. Added: the beam deals 30% more per second.',
  asTower: 'Beams the furthest enemy: 14 per second, range 3.5.',
  asAdded: 'The beam deals 30% more per second.',
  look: { shape: 'chevron', color: 'green', size: 0.22 },
  first: { kind: 'beam', damage: 0, range: 3.5, rate: 1, beam: { dps: 14 } },
  added: { damagePct: 1.3 },
  opening: true,
  tiers: {
    rare: { beamDps: 20, addedDamagePct: 1.52, asTower: 'Beams the furthest enemy: 20 per second, range 3.5.', asAdded: 'The beam deals 52% more per second.' },
    epic: { beamDps: 28, addedDamagePct: 1.67, asTower: 'Beams the furthest enemy: 28 per second, range 3.5.', asAdded: 'The beam deals 67% more per second.' },
  },
};
