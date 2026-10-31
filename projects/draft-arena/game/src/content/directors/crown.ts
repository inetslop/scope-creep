import type { Ctx, DirectorDef, Player } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

/**
 * The crown: the top scorer wears a yellow crown above their head (areas/crown.ts). The crown
 * moves only on a strict overtake or when the crowned critter is knocked out - a tie keeps it
 * where it is - and each move spreads the level-up ring from the new leader. Bots can wear it.
 */
export const crown: DirectorDef = {
  id: 'crown',
  name: 'The crown',
  description: 'The top scorer wears a yellow crown; it moves on a strict overtake.',
  tick(ctx, mem) {
    check(ctx, mem);
  },
  onKill(ctx, mem, _killer, victim) {
    if (victim.type === 'player') check(ctx, mem);
  },
};

/** A player's score. The engine keeps it on the live player, but the public Player type hides it. */
function score(p: Player): number {
  return (p as Player & { score: number }).score;
}

function check(ctx: Ctx, mem: Record<string, number>): void {
  let leader: Player | undefined;
  for (const p of ctx.players()) if (score(p) > 0 && (!leader || score(p) > score(leader))) leader = p;
  if (!leader) return; // every score is 0: no crown
  let wearer = mem.crown ? ctx.playerById(mem.crown) : undefined;
  if (!wearer || (leader.id !== wearer.id && score(leader) > score(wearer))) {
    // First score, a strict overtake, or the crowned critter is gone: the crown moves.
    mem.crown = leader.id;
    ctx.effect(RULES.effects.levelUp, { x: leader.x, y: leader.y });
    wearer = leader;
  }
  ctx.area(wearer, 'crown');
}
