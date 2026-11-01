import type { EnemyDef } from '../types';

export const hive: EnemyDef = {
  id: 'hive',
  name: 'Hive',
  description: 'The whole wave in one shape: it pops a Dot every 6 s while it walks — area kills answer it.',
  behavior: 'walk',
  hp: 720, // the boss base, like the Orb, wave-scaled like everything else
  speed: 0.9, // Block's, the boss norm
  gold: 20, // the boss bounty, like the Orb
  livesCost: 1,
  threat: 200, // the wave-40 budget's worth: it is the wave
  fromWave: 40,
  spawnOnly: true, // never in a normal mix; only the wave-40 boss
  pops: { everySec: 6, max: 5, telegraphSec: 0.8, into: 'dot' }, // its clock: five Dots, the first 6 s in
  look: { shape: 'pentagon', color: 'purple', size: 0.5 }, // the boss scale, a new silhouette in the warm family
};
