---
id: T0038
title: "The mark: a random player wears a red target for 15 s, and knocking them out pays"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T07:27:49Z
claimed_at: 2026-10-31T08:33:19Z
epic: E10
---

## Goal
The 6th field event (the cap): a 15-second window in which one random player becomes the target of everyone — the field turns from a farm into a hunt, and the marked player gets a speed boost to run.

## Details
- When and who: the first mark at 60 s, then a new mark every 90 s. It picks a random living player (human or bot); never the same player twice in a row when two or more are alive. Each mark lasts 15 s.
- What it is: the marked player wears a red target ring (a red ring with an ink rim, radius 26) 12 units above their head — the crown's height, but a red ring, not the yellow crown — pulsing once per second. The marked player gets a status, "Marked": +35% move speed for 15 s (283 u/s at the base 210); nothing else — the mark never slows or damages them.
- What it pays: a player who knocks out the marked player within the 15 s gets 20 bonus xp and 5 coins on top of the normal knockout bounty, score and coins; a burst plays where the mark was, plus the kill's normal coin pop. If the marked player is knocked out by a monster, or the 15 s expire, the ring pops into confetti and nothing is paid.
- What players see: a small pop where the ring appears, a pulse once per second while it lasts, and at the end either a burst (the kill) or a confetti pop (expired or lost to monsters).
- With 6 players: up to five hunters — the humans plus the bots, who fight players as usual — against one marked player; the +35% speed outruns a single pursuer but not two. With 60 players: the mark draws the whole field to one player; the first seconds are a melee and the mark is a reason sixty players converge on one spot.
- It swamps nothing: it adds no monsters and no pickups — only a status and a ring.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a windfall placed around one player | the rain is a place worth standing in; the mark is a moving target worth killing, and it runs from you |
| Gem geyser | a spot that pays while you hold it | the geyser pays its holder for as long as they stay; the mark pays exactly once, to the killer, and moves with its victim |
| Gem rush | a line to race across the field | the rush is a race for a pickup; the mark is a race for a player, and the prize is the kill itself, not what it drops |
| Swarm surge | a threat that comes at players | the surge comes from the edge and players dodge it; the mark is one of the players, and anyone can be it |
| The crown | a mark on a player that makes them a target | the crown is earned and stays until a strict overtake, so the leader can wear it a whole life; the mark is a 15-second lottery on any player, even a level-1 nobody, so the target is random and temporary |
| Kill coins | a standing coin payout on every kill | the mark adds a bonus to exactly one kill, on one random victim, for 15 s at a time |
| Prestige ring | a ring that plays where a prestige happens | the prestige ring reacts to something a player did; the mark is scheduled, and it is a threat, not a celebration |

## Acceptance criteria
- [ ] At 60 s and every 90 s after, a random living player (never the same player twice in a row) gets a red target ring (ink rim, radius 26) 12 units above their head; it pulses once per second and lasts 15 s.
- [ ] While marked, the player moves 35% faster (283 u/s at the base speed); the mark adds no damage or slow, and it is removed when the 15 s end or the player dies.
- [ ] A player who knocks out the marked player within the 15 s gets 20 bonus xp and 5 coins on top of the normal knockout payout; a burst plays where the mark was, plus the kill's normal coin pop.
- [ ] If the marked player is knocked out by a monster, or the 15 s expire, the ring pops into confetti and no bonus is paid.
- [ ] The mark adds no monsters and no pickups; it runs the same with 6 players (a few hunters; the marked one outruns a single pursuer) and with 60 (the field converges on one player).
- [ ] The ring reads as "danger is here": a red ring in the threat color, distinct from the yellow crown and from the yellow and green rewards.

## Design (architect, desktop)

### Files
- create `src/content/statuses/marked.ts` — the "Marked" status: +35% move speed, red ring color, no damage or slow.
- create `src/content/areas/mark.ts` — the red target ring (ink rim, radius 26, 12 units above the head, pulsing once per second), a follow area re-fired every tick exactly like `areas/crown.ts`.
- create `src/content/directors/mark.ts` — the schedule (first mark 60 s, then every 90 s), the random target pick, and the knockout payout.
- edit `src/content/statuses/index.ts` — one import line and one `marked,` registry line next to `mired,`.
- edit `src/content/areas/index.ts` — one import line and one `mark,` registry line next to `crown,`.
- edit `src/content/directors/index.ts` — one import line and one `mark,` registry line next to `crown,`. (T0033 adds its own line here too; add yours next to `crown,`, lines only.)

### Interfaces
No new types. Three defs, all existing interfaces from `engine/api.ts`:
- `marked: StatusDef` — `{ id: 'marked', name: 'Marked', color: PALETTE.red, speedMul: 1.35 }` (210 × 1.35 ≈ 283 u/s).
- `mark: AreaDef` — `{ id: 'mark', radius: 1, life: 0.15, interval: 1, follow: true, look: { shape: 'circle', color: PALETTE.red, draw(g, e) }, pulse() {} }`.
- `mark: DirectorDef` — `{ id: 'mark', name: 'The mark', description, tick(ctx, mem), onKill(ctx, mem, killer, victim) }`. Director `mem` keys (whole numbers, 0 = none): `mark` = target's player id, `last` = last marked id, `until` = expiry time, `next` = next fire time.

### Steps
1. `src/content/statuses/marked.ts`:
```ts
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The mark: +35% move speed for 15 s, nothing else. The red ring around the marked player. */
export const marked: StatusDef = { id: 'marked', name: 'Marked', color: PALETTE.red, speedMul: 1.35 };
```
2. `src/content/areas/mark.ts` (copy the shape of `areas/crown.ts`):
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

/**
 * The mark's target ring: a red ring with an ink rim, 12 units above the marked player's head
 * (the crown's height, but red). The mark director (directors/mark.ts) fires it every tick as a
 * short-lived area that follows the wearer; it pulses once per second.
 */
export const mark: AreaDef = {
  id: 'mark',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the ring never disappears
  interval: 1, // > life: the empty pulse fires once at birth, never again
  follow: true, // stays centred on the marked player; ends when they are knocked out
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const y0 = -(RULES.player.radius + 12); // 12 units above the head (top of the body is y = -radius)
      const r = 26 * (1 + 0.08 * Math.sin(e.time * Math.PI * 2)); // one pulse per second
      g.beginPath();
      g.arc(0, y0, r, 0, Math.PI * 2);
      g.lineWidth = 6;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.arc(0, y0, r, 0, Math.PI * 2);
      g.lineWidth = 3;
      g.strokeStyle = PALETTE.red;
      g.stroke();
    },
  },
  pulse() { /* a marker: no damage */ },
};
```
3. `src/content/directors/mark.ts`:
```ts
import type { DirectorDef } from '../../../engine/api.ts';
import { RULES } from '../rules.ts';

const FIRST = 60; // the first mark
const EVERY = 90; // then a new mark every 90 s
const DURATION = 15;
const RING = 26; // the ring's radius, and the pop/burst size
const BONUS_XP = 20;
const BONUS_COINS = 5;

/**
 * The mark: a random living player (human or bot, never the same one twice in a row when two or
 * more are alive) is marked for 15 s - a red target ring (areas/mark.ts) and +35% speed
 * (statuses/marked.ts). A player knockout pays 20 xp and 5 coins on top of the normal bounty,
 * with a burst where the ring was; a monster kill or an expired mark pops the ring into confetti
 * and pays nothing. It adds no monsters and no pickups.
 */
export const mark: DirectorDef = {
  id: 'mark',
  name: 'The mark',
  description: 'Every 90 s, a random player is marked for 15 s: +35% speed, and a bonus for who knocks them out.',
  tick(ctx, mem) {
    if (mem.until && ctx.time < mem.until) {
      const target = ctx.playerById(mem.mark);
      if (target) ctx.area(target, 'mark');
      return;
    }
    if (mem.until) {
      const gone = ctx.playerById(mem.mark); // expired: they are still alive (a kill clears mem first)
      mem.mark = 0;
      mem.until = 0;
      if (gone) ctx.effect('pop', spot(gone), undefined, RING);
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    const players = ctx.players();
    if (players.length === 0) return;
    const last = mem.last;
    const pool = players.length > 1 && last ? players.filter((p) => p.id !== last) : players;
    const p = ctx.rng.pick(pool);
    mem.mark = p.id;
    mem.last = p.id;
    mem.until = ctx.time + DURATION;
    ctx.addStatus(p, 'marked', DURATION);
    ctx.effect('pop', spot(p), undefined, 20);
  },
  onKill(ctx, mem, killer, victim) {
    if (victim.type !== 'player' || !mem.mark || victim.id !== mem.mark) return;
    mem.mark = 0;
    mem.until = 0;
    if (killer) {
      ctx.giveXp(killer, BONUS_XP);
      ctx.giveCoins(killer, BONUS_COINS);
      ctx.effect('burst', spot(victim), undefined, RING);
    } else {
      ctx.effect('pop', spot(victim), undefined, RING);
    }
  },
};

/** The ring's spot: 12 units above the head (the top of the body is at y = -radius). */
function spot(u: { x: number; y: number }) {
  return { x: u.x, y: u.y - (RULES.player.radius + 12) };
}
```
4. Registry lines, each next to the related line:
   - `src/content/statuses/index.ts`: `import { marked } from './marked.ts';` + `marked,` after `mired,`.
   - `src/content/areas/index.ts`: `import { mark } from './mark.ts';` + `mark,` after `crown,`.
   - `src/content/directors/index.ts`: `import { mark } from './mark.ts';` + `mark,` after `crown,`.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `ctx.effect(id, point, b?, value?)`: the third argument is `Point | undefined` — always pass `undefined` before the size number, or typecheck fails.
- `mem` is `Record<string, number>`: player ids are numbers, 0 means none. Never store names or booleans.
- The area must be re-fired every tick (life 0.15) like the crown — do not "improve" it into one 15 s area; the crown's comment says why.
- The engine already clears all statuses when a player is knocked out (`engine/sim/match.ts`), and the normal kill already pays score, bounty xp, coins (`kill-coins`) and the death burst — the mark only adds its own 20 xp, 5 coins and the extra burst/pop at the ring's height. Do not add a `.bot` guard: `giveCoins` already pays bots nothing.
- Client-side `draw(g, e)` uses `e.time` (client clock) for the pulse — never `Date`/`performance`/`Math.random` in `src/content/`; server randomness is `ctx.rng.pick`.
- Do not edit `rules.ts`, `base.css`, `engine/` or any other file: this is all new files plus three one-line registry additions. T0033 also adds a line to `directors/index.ts` — keep your addition to one line next to `crown,`.

### Tests
None — the whole feature is server hooks and draws, covered automatically by `engine/tests/` (director long-match, area/status validation, draw functions).
