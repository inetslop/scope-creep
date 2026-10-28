import type { EnemyDef } from '../types';

export const splitter: EnemyDef = {
  id: 'splitter',
  name: 'Splitter',
  description: 'A cracked Dot with deep pockets: killing it splits it into two splinters.',
  behavior: 'walk',
  hp: 90,
  speed: 1.2, // 75% of Dot's 1.6
  gold: 8, // twice Dot's 4
  livesCost: 1,
  threat: 1,
  fromWave: 9,
  splitsInto: 'splinter',
  look: { shape: 'circle', color: 'red', size: 0.264 }, // 1.2x Dot's 0.22
};
