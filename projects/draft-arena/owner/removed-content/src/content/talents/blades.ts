import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Gated: Orbit opens after 3 points anywhere in Blades; the capstone wants Orbit and Bleed. */
export const blades: TalentTreeDef = {
  id: 'blades',
  name: 'Blades',
  description: 'Blades around you, crits and bleeding.',
  look: { shape: 'square', color: PALETTE.teal },
  talents: [
    { id: 'crit', upgrade: 'crit', max: 3 },
    { id: 'bleed', upgrade: 'bleed', max: 3 },
    { id: 'orbit', upgrade: 'orbit', max: 5, points: 3 },
    { id: 'sawstorm', upgrade: 'sawstorm', max: 1, needs: [['orbit', 3], ['bleed', 1]] },
  ],
};
