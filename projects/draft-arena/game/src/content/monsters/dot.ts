import type { MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The basic monster: heads straight for the nearest player (the default behavior, no think). */
export const dot: MonsterDef = {
  id: 'dot',
  name: 'Dot',
  description: 'Heads straight for the nearest player.',
  hp: 12,
  speed: 85,
  radius: 14,
  damage: 12,
  xp: 1,
  weight: 10,
  fromLevel: 1,
  look: { shape: 'circle', color: PALETTE.red, face: { mood: 'angry' } },
};
