import type { AugmentDef } from '../types';

/**
 * The first sustained attack: a continuous line of damage that never fires a shot. As a tower's
 * first augment it beams the enemy furthest along; added to any tower it is a second line on the
 * enemy nearest the main target at half the rate. The line is gone the instant its target dies
 * or leaves range (core/beam.ts, systems/BeamSystem.ts). Its damage is the beam, so the opening
 * draft needs the `opening` flag to offer it.
 */
export const beam: AugmentDef = {
  id: 'beam',
  name: 'Beam',
  description: 'A continuous beam on the furthest enemy. Added: a second beam on the nearest.',
  asTower: 'Beams the furthest enemy: 14 per second, range 3.5.',
  asAdded: 'A second beam on the nearest enemy: 3 per second.',
  look: { shape: 'chevron', color: 'green', size: 0.22 },
  first: { kind: 'beam', damage: 0, range: 3.5, rate: 1, beam: { dps: 14 } },
  added: { beam: { dps: 3 } },
  opening: true,
  tiers: {
    rare: { beamDps: 20, addedBeamDps: 4, asTower: 'Beams the furthest enemy: 20 per second, range 3.5.', asAdded: 'A second beam on the nearest enemy: 4 per second.' },
    epic: { beamDps: 28, addedBeamDps: 5, asTower: 'Beams the furthest enemy: 28 per second, range 3.5.', asAdded: 'A second beam on the nearest enemy: 5 per second.' },
  },
};
