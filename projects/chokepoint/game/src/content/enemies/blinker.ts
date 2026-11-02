import type { EnemyDef } from '../types';

export const blinker: EnemyDef = {
  id: 'blinker',
  name: 'Blinker',
  description: 'The whole wave in one shape: it blinks 2.5 cells forward every 4 s — kill it while it blinks, or cover the road between.',
  behavior: 'blink',
  hp: 720,
  speed: 0.9, // the plain walk between blinks (0.9 cells/s; the step itself is a fixed 2.5 cells)
  gold: 20,
  livesCost: 1,
  threat: 300, // the wave-60 budget in one shape (core/waves.ts)
  fromWave: 60,
  spawnOnly: true,
  blinkCycle: { walkSec: 4, teleSec: 1, cells: 2.5 },
  look: { shape: 'almond', color: 'pink', size: 0.5 }, // a pink almond at 0.5: a silhouette no enemy has
};
