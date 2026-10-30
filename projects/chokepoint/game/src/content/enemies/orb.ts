import type { EnemyDef } from '../types';

export const orb: EnemyDef = {
  id: 'orb',
  name: 'Orb',
  description: 'The whole wave in one cracked shape: at half health it splits into two Shards that keep walking.',
  behavior: 'walk',
  hp: 720, // 6x Block's 120, like the Colossus, wave-scaled like everything else
  speed: 0.9, // Block's
  gold: 20, // the boss bounty, like the Colossus
  livesCost: 1,
  threat: 150, // a wave-30 budget's worth: it is the wave
  fromWave: 30,
  spawnOnly: true, // never in a normal mix; only the wave-30 boss
  splitsAt: { hpFrac: 0.5, into: 'shard' },
  look: { shape: 'hexagon', color: 'purple', size: 0.5 }, // a big cracked shape, its crack painted in
};
