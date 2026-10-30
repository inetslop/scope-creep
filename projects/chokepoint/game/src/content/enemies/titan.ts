import type { EnemyDef } from '../types';

export const titan: EnemyDef = {
  id: 'titan',
  name: 'Titan',
  description: 'A bigger wall of Block: while its Guard lives, every hit on it is halved.',
  behavior: 'walk',
  hp: 720, // the Colossus's 6x Block, wave-scaled like everything
  speed: 0.9, // Block's; the Guard's, so the two hold their gap
  gold: 20, // the boss bounty, the Colossus's
  livesCost: 1,
  threat: 95, // the boss's share of wave 20's budget (its Guard takes the rest)
  fromWave: 20,
  spawnOnly: true, // never in a normal mix; only the wave-20 boss, with its Guard
  shieldCarrier: 'guard', // while a Guard lives, every hit on it lands at half (core/shield.ts)
  look: { shape: 'square', color: 'red', size: 0.5 }, // the Colossus's wall in the family's other color
};
