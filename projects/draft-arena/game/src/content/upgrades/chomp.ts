import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Body capstone: kills heal, so standing in the crowd pays. */
export const chomp: UpgradeDef = {
  id: 'chomp',
  name: 'Chomp',
  description: 'On kill: heal 5 hp. On a player knockout: heal 25.',
  maxLevel: 1,
  look: { shape: 'pentagon', color: PALETTE.green },
  onKill(ctx, me, _level, victim) {
    ctx.heal(me, victim.type === 'player' ? 25 : 5);
  },
};
