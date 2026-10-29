import type { EnemyDef } from '../types';

export const ward: EnemyDef = {
  id: 'ward',
  name: 'Ward',
  description: 'Unstoppable: slow, roots and gusts do not touch it; every hit still lands.',
  behavior: 'walk',
  hp: 180, // 1.5 × Block's 120
  speed: 0.9, // Block's speed
  gold: 10, // Block's bounty
  livesCost: 1, // as usual (unlike Block's two)
  threat: 1, // placeholder: the Ward never gets drawn from the budget
  fromWave: 15,
  ignoresControl: true,
  look: { shape: 'circle', color: 'red', size: 0.26 }, // Block's size; the still ring is the new silhouette
};
