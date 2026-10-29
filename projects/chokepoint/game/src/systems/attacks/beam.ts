import type { Attack } from './attack';

/**
 * The beam never attacks on a cooldown: its lines are held and ticked every frame by
 * systems/BeamSystem.ts. This entry keeps ATTACKS total; systems/TowerSystem.ts skips beam
 * towers before they could reach here.
 */
export const beam: Attack = () => false;
