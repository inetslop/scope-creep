import type { EnemyDef } from '../types';

export const flyer: EnemyDef = {
  id: 'flyer',
  name: 'Flyer',
  description: "The crosser: flies straight from the island's edge to the exit — the road doesn't hold it.",
  behavior: 'walk',
  hp: 60,
  speed: 2.0, // the flight: a straight line, edge to exit (core/flyRoute.ts)
  gold: 8,
  livesCost: 1,
  threat: 3,
  fromWave: 13,
  flies: true,
  look: { shape: 'wings', color: 'purple', size: 0.2 }, // purple like the Dasher: the sky family; wings are new
};
