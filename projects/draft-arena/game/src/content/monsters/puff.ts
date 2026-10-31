import type { MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Slow and tanky; pops into three Dots when it dies. */
export const puff: MonsterDef = {
  id: 'puff',
  name: 'Puff',
  description: 'Pops into three Dots when it dies.',
  hp: 45,
  speed: 50,
  radius: 22,
  damage: 14,
  xp: 4,
  weight: 4,
  fromLevel: 3,
  look: { shape: 'pentagon', color: PALETTE.purple, face: { mood: 'calm', eyes: 1, mouth: 'o' } },
  onDeath(ctx, m) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.spawnMonster('dot', m.x + Math.cos(a) * 18, m.y + Math.sin(a) * 18);
    }
  },
};
