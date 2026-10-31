import type { DirectorDef } from '../../../engine/api.ts';

const MIN_LEVEL = 4;

/**
 * The corpse pays: a knocked-out player of level 4 or higher (human or bot) drops the standard
 * gem (pickups/gem.ts) worth their level in xp where they fell - a pickup fight anyone can join;
 * a level 1-3 corpse drops nothing. Pays xp only: kill coins already pay the killer the
 * victim's level in coins.
 */
export const corpse: DirectorDef = {
  id: 'corpse',
  name: 'The corpse pays',
  description: 'A knocked-out player of level 4 or higher drops a gem worth their level where they fell.',
  onKill(ctx, _mem, _killer, victim) {
    if (victim.type !== 'player' || victim.level < MIN_LEVEL) return;
    ctx.dropPickup('gem', victim.x, victim.y, victim.level);
  },
};
