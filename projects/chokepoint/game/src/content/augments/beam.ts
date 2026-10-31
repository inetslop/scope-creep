import type { AugmentDef } from '../types';

/**
 * The first sustained attack: a continuous line of damage that never fires a shot. As a tower's
 * first augment it beams the enemy furthest along; added to a beam tower it fattens that line —
 * a flat per-second addition per copy, one width step each, no second line. Added to any other
 * kind it does nothing: there is no beam to fatten. The line is gone the instant its target dies
 * or leaves range (core/beam.ts, systems/BeamSystem.ts). Its damage is the beam, so the opening
 * draft needs the `opening` flag to offer it.
 */
export const beam: AugmentDef = {
  id: 'beam',
  name: 'Beam',
  description: 'A continuous beam on the furthest enemy. Added: the beam deals 5 more per second.',
  asTower: 'Beams the furthest enemy: 14 per second, range 3.5.',
  asAdded: 'The beam deals 5 more per second.',
  look: { shape: 'chevron', color: 'green', size: 0.22 },
  first: { kind: 'beam', damage: 0, range: 3.5, rate: 1, beam: { dps: 14 } },
  added: { beam: { dps: 5 } },
  opening: true,
  tiers: {
    rare: { beamDps: 20, addedBeamDps: 7, asTower: 'Beams the furthest enemy: 20 per second, range 3.5.', asAdded: 'The beam deals 7 more per second.' },
    epic: { beamDps: 28, addedBeamDps: 9, asTower: 'Beams the furthest enemy: 28 per second, range 3.5.', asAdded: 'The beam deals 9 more per second.' },
  },
};
