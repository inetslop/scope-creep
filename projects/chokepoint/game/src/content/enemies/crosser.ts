import type { EnemyDef } from '../types';

export const crosser: EnemyDef = {
  id: 'crosser',
  name: 'Flyer',
  description: 'The whole wave in one shape: it crosses the island in a straight line — cover the line, not the road.',
  behavior: 'fly',
  hp: 720,
  speed: 0.7, // the crossing: a straight line over the board, banking once at half health (core/flyRoute.ts)
  gold: 20,
  livesCost: 1,
  threat: 250, // the wave-50 budget in one shape (core/waves.ts)
  fromWave: 50,
  spawnOnly: true,
  bank: { hpFrac: 0.5, previewSec: 0.8 },
  look: { shape: 'triangle', color: 'red', size: 0.5 }, // a red triangle at 0.5: a shape no enemy has
};
