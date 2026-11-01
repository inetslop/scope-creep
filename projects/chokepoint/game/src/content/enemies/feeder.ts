import type { EnemyDef } from '../types';

export const feeder: EnemyDef = {
  id: 'feeder',
  name: 'Feeder',
  description: 'The slow one that pushes the pack: everything within two cells walks a quarter faster while it lives.',
  behavior: 'walk',
  hp: 90,
  speed: 0.8,
  gold: 8,
  livesCost: 1,
  threat: 3,
  fromWave: 13,
  look: { shape: 'crescent', color: 'orange', size: 0.26 }, // orange like the Sprinter: the speed family
};
