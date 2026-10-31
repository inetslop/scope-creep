import type { TalentTreeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The crowd is the weapon: every hit lands harder the more enemies stand around. */
export const hive: TalentTreeDef = {
  id: 'hive',
  name: 'Hive',
  description: 'The crowd is your weapon: the more around, the harder you hit.',
  look: { shape: 'hexagon', color: PALETTE.purple },
  talents: [
    { id: 'swarm', upgrade: 'swarm', max: 3 },
    { id: 'horn', upgrade: 'horn', max: 3, needs: [['swarm', 1]] },
  ],
};
