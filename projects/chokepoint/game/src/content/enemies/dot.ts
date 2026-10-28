import type { EnemyDef } from '../types';

export const dot: EnemyDef = {
  id: 'dot',
  name: 'Dot',
  description: 'The basic walker: steady speed, middling health.',
  behavior: 'walk',
  hp: 30,
  speed: 1.6,
  gold: 4,
  livesCost: 1,
  threat: 1,
  fromWave: 1,
  look: { shape: 'circle', color: 'red', size: 0.22 },
};
