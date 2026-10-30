import type { EnemyDef } from '../types';

export const guard: EnemyDef = {
  id: 'guard',
  name: 'Guard',
  description: "Carries the Titan's shield: kill it to make the Titan take full damage.",
  behavior: 'walk',
  hp: 60,
  speed: 0.9, // the Titan's, so the two hold their gap
  gold: 8,
  livesCost: 1,
  threat: 5, // the escort's share of wave 20's budget
  fromWave: 20,
  spawnOnly: true, // never in a normal mix; only the wave-20 escort, ahead of its Titan
  look: { shape: 'diamond', color: 'red', size: 0.2 }, // small, its orange shield disc on its road-facing front
};
