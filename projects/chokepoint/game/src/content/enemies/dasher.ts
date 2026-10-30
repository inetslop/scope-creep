import type { EnemyDef } from '../types';

export const dasher: EnemyDef = {
  id: 'dasher',
  name: 'Dasher',
  description: 'Crawls, stops to wind up, then dashes: catch it mid-stop.',
  behavior: 'dash',
  hp: 30,
  speed: 1.4, // the crawl: half of 2.8; the surge lives in dashCycle
  gold: 4,
  livesCost: 1,
  threat: 2,
  fromWave: 5,
  look: { shape: 'diamond', color: 'purple', size: 0.22 }, // small like Dot; diamond is unused by enemies
  dashCycle: { crawlSec: 2.5, pauseSec: 0.5, dashCells: 3, dashSec: 0.3 }, // the surge is 10 cells/s
};
