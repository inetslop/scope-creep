import type { EnemyDef } from '../types';

export const colossus: EnemyDef = {
  id: 'colossus',
  name: 'Colossus',
  description: 'The whole wave in one shape: at half health it is out of reach for a beat, again every 8 s.',
  behavior: 'walk',
  hp: 720, // 6x Block's 120, wave-scaled like everything else
  speed: 0.9, // Block's
  gold: 20, // Block's doubled
  livesCost: 1,
  threat: 50, // a wave-10 budget's worth: it is the wave
  fromWave: 10,
  spawnOnly: true, // never in a normal mix; only the boss wave's shape
  outOfReach: { hpFrac: 0.5, telegraphSec: 0.5, phaseSec: 2.5, periodSec: 8 },
  look: { shape: 'square', color: 'purple', size: 0.45 }, // a wall of Block
};
