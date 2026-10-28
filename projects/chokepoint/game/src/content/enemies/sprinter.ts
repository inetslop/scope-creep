import type { EnemyDef } from '../types';

export const sprinter: EnemyDef = {
  id: 'sprinter',
  name: 'Sprinter',
  description: 'Gets faster every time it is hit: melt it before it takes off.',
  behavior: 'walk',
  hp: 30,
  speed: 2.52,
  gold: 3,
  livesCost: 1,
  threat: 3,
  fromWave: 8,
  look: { shape: 'chevron', color: 'orange', size: 0.21 },
  speedRamp: { perHit: 0.28, max: 5.32 }, // 90% of Dart's 2.8; +10% of it per hit; capped at 190% (10 hits)
};
