import type { EnemyDef } from '../types';

export const hauler: EnemyDef = {
  id: 'hauler',
  name: 'Hauler',
  description: 'Big and slow, and it hauls a small fortune: 10 gold for the kill, a life and 5 gold if it gets through.',
  behavior: 'walk',
  hp: 360, // 3× Block's 120
  speed: 0.9, // Block's speed
  gold: 10,
  livesCost: 1,
  threat: 1, // placeholder: the Hauler never gets drawn from the budget
  fromWave: 9,
  look: { shape: 'hexagon', color: 'red', size: 0.34 }, // 1.3× Block's 0.26; round, no enemy shape has it
};
