import type { EnemyDef } from '../types';

export const splinter: EnemyDef = {
  id: 'splinter',
  name: 'Splinter',
  description: 'A small, fast piece of a killed Splitter.',
  behavior: 'walk',
  hp: 15, // half of Dot's 30
  speed: 2, // 1.25x Dot's 1.6
  gold: 4, // Dot's gold
  livesCost: 1,
  threat: 1,
  fromWave: 9,
  spawnOnly: true, // never in a wave's mix; only split off a Splitter
  look: { shape: 'circle', color: 'red', size: 0.132 }, // 0.6x Dot's 0.22
};
