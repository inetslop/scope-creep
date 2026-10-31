import type { DirectorDef } from '../../../engine/api.ts';

const XP = 15; // xp on top of the normal knockout bounty
const COINS = 5; // coins on top of the kill's coins (kill-coins); a bot killer gets none
const RING = 26; // the burst where the feud ended (the mark's size, as in price.ts)

/**
 * The grudge: two players who knock each other out again bear a red knot (statuses/grudge-knot.ts, kept on by
 * my tick) until the next knockout between the two, which pays its killer on top of the normal bounty. The
 * memory lasts the whole match: a monster knockout clears nothing and a feuding player comes back still
 * wearing the knot. A player bears at most one grudge: a new one drops the old (no pay, the old knot comes
 * off). mem: 'myg:<id>' is a player's grudge partner; 'last:<a>:<b>' (a < b) is who knocked out the other
 * last in that pair.
 */
export const grudge: DirectorDef = {
  id: 'grudge',
  name: 'The grudge',
  description: 'Two players who knock each other out again bear a red knot; whoever ends the feud pays.',
  tick(ctx, mem) {
    for (const p of ctx.players()) {
      const other = mem[`myg:${p.id}`];
      if (!other) continue;
      if (!ctx.playerById(other)) {
        dropGrudge(mem, p.id); // the other side of the feud left the match: the knot comes off
        continue;
      }
      ctx.addStatus(p, 'grudge-knot', 0.2);
    }
  },
  onKill(ctx, mem, killer, victim) {
    if (victim.type !== 'player' || !killer || killer.id === victim.id) return; // only a player on a player
    const key = `last:${Math.min(killer.id, victim.id)}:${Math.max(killer.id, victim.id)}`;
    if (mem[`myg:${killer.id}`] === victim.id) {
      // The pair bears a grudge: this knockout ends the feud and pays.
      ctx.giveXp(killer, XP);
      ctx.effect('burst', { x: victim.x, y: victim.y }, undefined, RING);
      if (!killer.bot) {
        ctx.giveCoins(killer, COINS);
        ctx.effect('coin', { x: victim.x, y: victim.y }, undefined, COINS);
      }
      dropGrudge(mem, killer.id);
      dropGrudge(mem, victim.id);
    } else if ((mem[key] ?? 0) === victim.id) {
      // The victim knocked the killer out last this match: the feud forms.
      setGrudge(mem, killer.id, victim.id);
      setGrudge(mem, victim.id, killer.id);
    }
    mem[key] = killer.id; // the killer knocked the victim out last now
  },
};

/** End or drop one side of a feud; the knot comes off within a tick (no remove call: stop refreshing). */
function dropGrudge(mem: Record<string, number>, id: number) {
  const other = mem[`myg:${id}`];
  if (!other) return;
  delete mem[`myg:${id}`];
  if (mem[`myg:${other}`] === id) delete mem[`myg:${other}`];
}

/** A player bears at most one grudge: a new one drops any other they are in. */
function setGrudge(mem: Record<string, number>, id: number, partner: number) {
  const old = mem[`myg:${id}`];
  if (old && old !== partner && mem[`myg:${old}`] === id) delete mem[`myg:${old}`];
  mem[`myg:${id}`] = partner;
}
