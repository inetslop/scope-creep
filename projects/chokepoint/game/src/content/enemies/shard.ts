import type { EnemyDef } from '../types';

export const shard: EnemyDef = {
  id: 'shard',
  name: 'Shard',
  description: 'A small, fast piece of a split Orb.',
  behavior: 'walk',
  hp: 180, // a quarter of the Orb's 720; the split's inheritance rule sets the live value
  speed: 1.3, // faster than the Orb's 0.9: the split is a pressure spike
  gold: 12, // two Shards pay 24, more than the 20 the Orb pays
  livesCost: 1,
  threat: 2,
  fromWave: 30,
  spawnOnly: true, // never in a wave's mix; only split off a mid-life Orb
  look: { shape: 'hexagon', color: 'purple', size: 0.2 }, // the piece: no crack
};
