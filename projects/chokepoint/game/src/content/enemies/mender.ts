import type { EnemyDef } from '../types';

export const mender: EnemyDef = {
  id: 'mender',
  name: 'Mender',
  description: 'Mends itself and its pack: every 5 s it and its living Wards within three cells flash and restore 15% of their max hp, four times.',
  behavior: 'walk',
  hp: 720, // the boss base, like the Orb, wave-scaled like everything else
  speed: 0.9, // Block's, the boss norm
  gold: 20, // the boss bounty, like the Orb
  livesCost: 1,
  threat: 348, // the wave-70 budget's worth minus its two Wards (each at the Ward's own threat of 1, as the Titan's 95 + the Guard's 5 did)
  fromWave: 70,
  spawnOnly: true, // never in a normal mix; only the wave-70 boss, with its two Ward escorts
  mends: { everySec: 5, count: 4, radius: 3, frac: 0.15, telegraphSec: 1.2, escortId: 'ward' }, // its clock: four mends, the first 5 s in
  look: { shape: 'circle', color: 'orange', size: 0.5 }, // the boss scale; a solid orange circle is a silhouette no enemy wears
};
