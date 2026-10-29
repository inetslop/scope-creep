import type { EnemyDef } from '../types';

export const mute: EnemyDef = {
  id: 'mute',
  name: 'Mute',
  description: 'Holds the road in silence: while it lives, every tower within two cells of it holds still.',
  behavior: 'walk',
  hp: 120, // Block's
  speed: 0.9, // Block's speed
  gold: 10,
  livesCost: 1,
  threat: 1, // placeholder: the Mute never gets drawn from the budget
  fromWave: 11,
  look: { shape: 'ring', color: 'purple', size: 0.26 }, // Block's size; the hole is the new silhouette
};
