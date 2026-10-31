import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Wide: everything is open but the weapon (4 points in Warden) and the capstone (9). */
export const warden: TalentTreeDef = {
  id: 'warden',
  name: 'Warden',
  description: 'Hard to kill, hurts whatever comes close.',
  look: { shape: 'circle', color: PALETTE.green },
  talents: [
    { id: 'vigor', upgrade: 'vigor', max: 3 },
    { id: 'armor', upgrade: 'armor', max: 3 },
    { id: 'aura', upgrade: 'aura', max: 5, points: 4 },
    { id: 'nova', upgrade: 'nova', max: 1, points: 9 },
  ],
};
