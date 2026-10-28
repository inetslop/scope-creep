import type { EnemyDef } from '../types';

export const block: EnemyDef = {
  id: 'block',
  name: 'Block',
  description: 'Slow and heavy: soaks damage and costs two lives if it gets through.',
  behavior: 'walk',
  hp: 120,
  speed: 0.9,
  gold: 10,
  livesCost: 2,
  threat: 4,
  fromWave: 4,
  look: { shape: 'square', color: 'purple', size: 0.26 },
};
