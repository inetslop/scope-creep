import type { EnemyDef } from '../types';

export const leech: EnemyDef = {
  id: 'leech',
  name: 'Leech',
  description: 'A big pink maw that drinks the health of the Haulers beside it into itself, until its maw closes.',
  behavior: 'walk',
  hp: 720, // the boss base, the Titan's, wave-scaled like every boss
  speed: 0.9, // Block's; the Hauler's, so the two hold their gap
  gold: 20, // the boss bounty, the Titan's
  livesCost: 1,
  threat: 400, // the boss ladder's next step after the Mender's 348 (spawnOnly: never drawn from the budget)
  fromWave: 80,
  spawnOnly: true, // never in a normal mix; only the wave-80 boss, with its Haulers
  drinks: { everySec: 5, telegraphSec: 0.8, drinkSec: 0.6, maxDrinks: 8, drinkPct: 0.08, escort: 'hauler' },
  look: { shape: 'maw', color: 'pink', size: 0.5 }, // the family's big shape, with its maw open
};
