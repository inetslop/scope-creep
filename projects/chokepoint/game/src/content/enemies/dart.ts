import type { EnemyDef } from '../types';

export const dart: EnemyDef = {
  id: 'dart',
  name: 'Dart',
  description: 'Fast and fragile: outruns slow towers, dies to anything that lands.',
  behavior: 'walk',
  hp: 16,
  speed: 2.8,
  gold: 3,
  livesCost: 1,
  threat: 1,
  fromWave: 2,
  look: { shape: 'triangle', color: 'orange', size: 0.21 },
};
