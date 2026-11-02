import type { EnemyDef } from '../types';

export const gorge: EnemyDef = {
  id: 'gorge',
  name: 'Gorge',
  description: 'A red spiral that feeds on the leaks of the Splinters that walk in ahead of it.',
  behavior: 'walk',
  hp: 720, // the boss base, like the Leech, wave-scaled like everything else
  speed: 0.9, // Block's, the boss norm
  gold: 20, // the boss bounty, like the Leech
  livesCost: 1,
  threat: 448, // the wave-90 budget's worth minus its two Splinters (each at the Splinter's own threat of 1, as the Mender's 348 was the 350 minus its two Wards)
  fromWave: 90,
  spawnOnly: true, // never in a normal mix; only the wave-90 boss, with its two Splinter escorts
  feeds: { max: 2, frac: 0.15, ringCells: 2 }, // its feed: twice, 15% of its own max hp per leak of another enemy
  look: { shape: 'spiral', color: 'red', size: 0.5 }, // the boss scale; a thick red spiral is a silhouette no enemy wears
};
