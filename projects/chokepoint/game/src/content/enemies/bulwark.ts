import type { EnemyDef } from '../types';

export const bulwark: EnemyDef = {
  id: 'bulwark',
  name: 'Bulwark',
  description: 'Wears a plate across its front: shots into the face are halved, into the back they go through.',
  behavior: 'walk',
  hp: 120, // Block's hp; the plate is armor, not health
  speed: 0.72, // 80% of Block's 0.9
  gold: 10, // Block's reward
  livesCost: 1,
  threat: 1, // placeholder: the Bulwark never gets drawn from the budget
  fromWave: 12,
  plate: 0.5, // a shot into the plate takes half (core/plate.ts)
  look: { shape: 'circle', color: 'red', size: 0.325 }, // 1.25× Block's 0.26
};
