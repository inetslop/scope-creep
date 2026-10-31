---
id: T0130
title: "The grudge: two players who knock each other out wear a knot, and the end of the feud pays"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T21:28:31Z
claimed_at: 2026-10-31T22:22:46Z
finished_at: 2026-10-31T23:03:40Z
epic: E30
---

## Goal
A personal feud inside the big field: two players who knock each other out wear a red knot the whole field can see, and whoever ends the feud gets paid — so the player who beat you is a target with a price, not just another critter.

## Details
- New permanent-rule director `src/content/directors/grudge.ts` ("The grudge": "Two players who knock each other out again bear a red knot; whoever ends the feud pays."), registered in `src/content/directors/index.ts` right after `price` (it runs on the same pvp-knockout hooks). Its `mem` holds, per match, for each pair of players: who knocked out the other last, and whether the pair bears a grudge. A new match starts fresh.
- On every player knockout (killer K, victim V, players and bots alike):
  - If the pair bears a grudge: the grudge pays — K gets +15 xp and +5 coins on top of the normal knockout xp and the kill coins (coins via the same route as `kill-coins`; a bot killer gets none). The grudge is then gone.
  - Else if V knocked out K last this match: the feud forms — the pair now bears a grudge, the "last" becomes K, and both wear the knot (K at once, V from its 3 s respawn).
  - Else: remember that K knocked out V.
- The memory of a duel lasts the whole match and is not cleared by a knockout: a feuding player who dies comes back still bearing the knot, and the feud ends only with the paid knockout between the two.
- A player bears at most one grudge at a time: when a grudge forms for a player, any other pending grudge that player is in is dropped (no pay, the old knot comes off).
- The knot: a new area `src/content/areas/grudge-knot.ts`, modeled on `prestige-stars.ts` (a mark drawn on the player, kept in step by the director's tick): a small red ribbon knot — two small triangular bow tips with a square tie in the middle, candy red with an ink outline, about 0.35 of the body radius across — pinned to the top-left of the critter, mirrored to the prestige stars' top-right, clear of the eyes, the crown, the wound and the name.
- What a player sees: the knot appears on the killer's critter the moment the second mutual knockout happens, and on the victim's critter when it comes back in three seconds. While it shows, both feuding players are readable in a crowd: a red knot is the game's threat color (the wound, the mark). No HUD element — the field shows it, like the crown and the stars.
- With 6 players (a few humans and bots): a feud can be against a bot — the bot wears the knot, and a human who ends it gets the +15 xp and the 5 coins. With 60: many pairs feud at once; the state is one line per pair, and the only thing the field adds is one knot per feuding player.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| The crown | a mark that moves on the critter and pays out on a pvp knockout | the crown follows the top score of everyone; the grudge follows the duel of one pair and pays whichever of the two ends it |
| The mark | a timed target whose knockout pays a bonus | the mark is a random 15 s on one player; the grudge is earned by two players, lasts until it pays, and wears on both of them |
| The price | a mark that lands on the killer after a pvp knockout | the price is a cost that chases the killer; the grudge is a feud both players wear, and it pays out instead of costing |
| The corpse pays | xp from a player's death | the corpse gem goes to whoever grabs it; the grudge pays only the rival who ends the feud |
| Kill coins | coins on a player knockout | kill coins pay every kill the same way; the grudge pays only the knockout that ends a repeated duel, with xp too |
| Gem rain | a director that runs the whole match | a timed windfall around a player; the grudge is a standing pvp rule with no timer |
| Gem geyser | a director that runs the whole match | a spot to hold; the grudge makes a player worth hunting |
| Gem rush | a director that runs the whole match | a race for a line of gems; the grudge is a duel, not a pickup |
| Jackpot | a director that runs the whole match | a prize in the middle; the grudge is between two players |
| Swarm surge | a director that runs the whole match | a crowd threat from the edge; the grudge is a mark on players |
| Prestige pays | a director that pays coins | coins on a prestige; the grudge pays on a pvp knockout |
| Prestige point | a director that pays on a prestige | talent points on a prestige; the grudge pays xp and coins on a knockout |
| Prestige feast | a director that lays gems where a prestige happens | gems for the neighbors; the grudge lays nothing, it marks the feuding pair |
| Prestige ring | an effect at a prestige moment | a visual for a prestige; the grudge's knot wears on the critter until the feud pays |
| Prestige stars | a mark drawn on the player that the director refreshes | stars count prestiges this life and fade on a knockout; the knot counts a feud and lasts across knockouts until it pays |
| Growth | a director that adjusts players each tick | a size stat by level; the grudge is a feud memory with a payoff |

## Acceptance criteria
- [ ] When a player knocks out someone who knocked them out earlier this match, a small red ribbon knot appears at once on the killer's critter at the top-left, and the victim's critter wears the same knot when it comes back.
- [ ] The next knockout between the same two players pays the killer +15 xp and +5 coins on top of the normal bounty and the kill coins, and afterwards neither wears the knot.
- [ ] A knockout by a monster does not clear a knot: a feuding player knocked out by a monster comes back in three seconds still wearing it.
- [ ] A player who forms a new grudge wears only the newest knot; the older one comes off and pays nothing.
- [ ] Bots take part: a knot can sit on a bot's critter, and a human who ends a feud with a bot gets the +15 xp and no coins land in the bot's profile.
- [ ] The knot never covers the eyes, the crown, the prestige stars or the player's name, and it reads at a glance on a critter in a crowd.

## Design (architect, desktop)

### Files
- create `src/content/statuses/grudge-knot.ts` - the knot, a `StatusDef` with its own `draw()`. **Not an area**: the task says `src/content/areas/grudge-knot.ts`, but a mark on a creature must be a status (an area trails behind — CLAUDE.md, and the model `prestige-stars.ts` is a director that keeps *statuses* `prestige-1..3`; that parenthetical is what we build).
- create `src/content/directors/grudge.ts` - the feud: per-pair memory, the payoff, and the `tick` that keeps the knot on.
- edit `src/content/statuses/index.ts` - one import + one line in `STATUSES`.
- edit `src/content/directors/index.ts` - one import + one line in `DIRECTORS`, right after `price`.

### Interfaces
No new types. Two exports, both using existing engine types:
```ts
// src/content/statuses/grudge-knot.ts
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The grudge knot (directors/grudge.ts keeps it on both players of a feud): a small red ribbon knot at the
 * top-left of the critter, mirroring the prestige stars' top-right. One shared outline: two triangular bow
 * tips around a square tie. Clear of the eyes, the crown and the name. */
export const grudgeKnot: StatusDef = {
  id: 'grudge-knot',
  name: 'Grudge',
  color: PALETTE.red,
  above: 8,
  draw(g, v) {
    const s = 0.175 * v.radius; // half the knot's width (0.35r across)
    const q = 0.1 * v.radius; // half the square tie
    g.save();
    g.translate(-(v.radius + 6), -(v.radius + 5)); // mirror of the first prestige star
    g.beginPath();
    g.moveTo(-s, 0);
    g.lineTo(-q, -q);
    g.lineTo(q, -q);
    g.lineTo(s, 0);
    g.lineTo(q, q);
    g.lineTo(-q, q);
    g.closePath();
    g.fillStyle = PALETTE.red;
    g.fill();
    g.lineJoin = 'round';
    g.lineWidth = 2;
    g.strokeStyle = v.ink;
    g.stroke();
    g.restore();
  },
};
```
```ts
// src/content/directors/grudge.ts
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
      if (mem[`myg:${p.id}`]) ctx.addStatus(p, 'grudge-knot', 0.2);
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
```

### Steps
1. Create `src/content/statuses/grudge-knot.ts` exactly as above.
2. Create `src/content/directors/grudge.ts` exactly as above.
3. In `src/content/statuses/index.ts`: add `import { grudgeKnot } from './grudge-knot.ts';` right after the `marked` import (line 12), and add `grudgeKnot,` right after `marked,` in `STATUSES` (line 25).
4. In `src/content/directors/index.ts`: add `import { grudge } from './grudge.ts';` right after the `price` import (line 9), and add `grudge,` right after `price,` in `DIRECTORS` (line 30).
5. Run `npm run check`.

### Pitfalls
- Do NOT create `src/content/areas/grudge-knot.ts` and do NOT register a status in the areas registry — the engine tests fail on a file that doesn't hold an item of its name in its own registry, and a following area trails behind the critter.
- `mem` is `Record<string, number>` only: no objects, no ids packed into one number — use the string keys exactly as shown.
- Never `addStatus` the victim directly at feud formation: the victim is dead, and `ctx.players()` lists only living players; the `tick` puts the knot on it automatically when it respawns (and re-puts it after any monster knockout). The knot coming off is just stopping the 0.2 s refresh — there is no removal call.
- The grudge check reads only the killer's side (`myg:killer === victim.id`); that is valid because `setGrudge`/`dropGrudge` always keep both sides in lockstep. Keep it that way.
- No `Math.random`/`Date`/`performance` anywhere (lint); this design needs none.
- The two registry files are also edited by T0125 (streak): add only your two lines in each; the runner serializes same-file edits, but keep your lines next to `marked`/`price` as specified.
- The knot must stay a single closed path (one outline): do not stroke the square tie separately.

### Tests
- none (content is tested automatically by engine/tests/; no exported pure helpers).

## Result (attempt 1, asus)

Added the grudge feud rule: a new status `src/content/statuses/grudge-knot.ts` (a small red ribbon knot at the top-left of the critter, mirroring the prestige stars' top-right, one shared ink outline) and a new director `src/content/directors/grudge.ts` that remembers each pair's last knockout, forms a grudge when two players knock each other out a second time, keeps the knot on both via a 0.2 s status refresh (surviving monster deaths and respawns), drops any older grudge when a new one forms, and pays the killer +15 xp and +5 coins (no coins to bots) when the next knockout between the pair ends the feud. Registered both in their `index.ts` registries next to `marked` and `price` as the design specified. Note: the task body mentioned an areas path, but I followed the design's (and CLAUDE.md's) approach of a status, since a mark on a creature must move with it — an area would trail behind.

- Self-review: APPROVE
- Time: 40.9 min
- Self-review made fixes (kept; checks pass).

```
.../game/src/content/directors/grudge.ts           | 65 ++++++++++++++++++++++
 .../game/src/content/directors/index.ts            |  2 +
 .../game/src/content/statuses/grudge-knot.ts       | 33 +++++++++++
 .../draft-arena/game/src/content/statuses/index.ts |  2 +
 4 files changed, 102 insertions(+)
```
