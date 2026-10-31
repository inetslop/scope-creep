---
id: T0027
title: "Coins from events: every gem an event drops pays 1 coin"
assignee: desktop
size: S
priority: 2
status: done
depends_on: [T0019, T0011, T0012]
attempts: 1
created: 2026-10-31T05:24:06Z
claimed_at: 2026-10-31T07:46:45Z
finished_at: 2026-10-31T07:53:46Z
epic: E6
---

## Goal
The positions and races the field events make pay in the long game too: a gem dropped by a field event pays 1 coin when collected, on top of its xp, so moving for the events is worth more than standing still.

## Details
- What pays: every gem a director drops — Gem rain's 24-gem ring, the Gem rush's line of 12 (first touch takes all), the Gem geyser's 8 bubbling gems — and, if it exists by design time, the crown's leader's gem (T0014): 1 coin per gem collected, in addition to the gem's xp, which stays exactly what it is today. Monster drops pay no coins (the kills already pay, T0019).
- Mechanism (the architect picks): if the event gem keeps the shared gem pickup, the pickup must know it came from a director; the cleanest is a second pickup for the event gem in src/content/pickups/, a candy look in the reward family (yellow or green) that tells apart from the monster's gem at a glance, worth the same xp as the gem it replaces. Whatever the mechanism, no event gem's xp changes and no monster gem starts paying.
- Seen where it happens: T0019's coin pop plays at the gem's spot, one coin per gem. When a Gem rush winner takes the whole line, one coin pop with value 12 at the first gem — the short fountain the coin effect already does.
- Pace in a 5-minute match: a player who fights for the events (a gem rain they reach, a geyser they hold, a rush they win) earns roughly 10–40 more coins than one who ignores the events — on top of the 60–120 kill pay, a bonus for the players who move, not a second salary. Bots collect gems and get no coins and no coin pop, like every other coin source.
- 6 players and 60: the pay is per gem collected, so a full match only splits the same gems across more players; nothing scales.

## Acceptance criteria
- [ ] Collect a gem from a gem rain ring: a coin pop plays at the gem's spot and the player's coins go up by 1 (visible on the start card on the next visit); the gem's xp is unchanged.
- [ ] Win a gem rush: the winner collects the whole line and gets 12 coins, one 12-coin fountain at the first gem.
- [ ] Kill a Dot: its gem pays no coin (the kill itself still pays 1, T0019).
- [ ] A bot collecting an event gem gets no coins and no coin pop.
- [ ] Event gems tell apart from the monster's gems at a glance, and the xp of every event gem is the same as before this change.
- [ ] No new HUD element: the coin pop is the readout, the balance stays on the start card.

## Design (architect, yoga)

### Files
- create `src/content/pickups/event-gem.ts` - the event gem pickup `eventGem` (id `event-gem`): what field events drop; same xp as the gem it replaces, plus 1 coin (humans only) with T0019's coin pop
- edit `src/content/pickups/index.ts` - import `eventGem` and one line in `PICKUPS`
- edit `src/content/directors/gem-rain.ts` - drop `'event-gem'` instead of `'gem'` (one line)
- edit `src/content/directors/gem-geyser.ts` - drop `'event-gem'` instead of `'gem'` (one line)
- edit `src/content/directors/gem-rush.ts` - pay the grabber 12 coins + one 12-coin coin pop at the first gem (bots none)

### Interfaces
No new types. New export, exact:
```ts
export const eventGem: PickupDef = {
  id: 'event-gem',
  radius: 7,
  life: 30,
  look: { shape: 'star', color: PALETTE.yellow },
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
    if (!p.bot) {
      ctx.giveCoins(p, 1);
      ctx.effect('coin', { x: p.x, y: p.y }, undefined, 1);
    }
  },
};
```

### Steps
1. Read `src/content/pickups/gem.ts` (closest example) and create `src/content/pickups/event-gem.ts` with the def above (copy `gem.ts`, change id/look/collect; keep `radius: 7`, `life: 30`). The coin effect call: first read `src/content/directors/kill-coins.ts` (T0019) and use exactly the shape of `ctx.effect('coin', ...)` call it makes there (a `Point` + value).
2. Edit `src/content/pickups/index.ts`: `import { eventGem } from './event-gem.ts';` (above the gem import) and add `eventGem,` as its own line in `PICKUPS`, before `gem,`.
3. `gem-rain.ts` line 19: `ctx.dropPickup('event-gem', p.x + Math.cos(a) * 220, p.y + Math.sin(a) * 220, 2);`
4. `gem-geyser.ts` line 21: `ctx.dropPickup('event-gem', mem.x, mem.y, XP);` (XP stays 4)
5. `gem-rush.ts`: leave both `dropPickup('gem', ..., 0)` lines alone; after `ctx.giveXp(p, 12);` (line 60) add:
```ts
      if (!p.bot) {
        ctx.giveCoins(p, 12);
        ctx.effect('coin', { x, y }, undefined, 12);
      }
```
(`x`/`y` are the first gem's spot, already in scope.)

### Pitfalls
- The rush must NOT switch to the new pickup: 12 separate 1-coin collects would draw 12 one-coin pops instead of the one 12-coin fountain at the first gem. Director pays all 12 coins at once; its gems stay value-0 plain `gem` (0 xp, no coin, no pop).
- Never touch `pickups/gem.ts`: monster drops come from the engine (rules.gem) and must pay no coins. All xp values are untouched (rain 2, geyser 4, rush 12 to the grabber).
- Guard the effect with `p.bot` (coins are engine-guaranteed bot-free, but the pop must not play for a bot collect).
- `ctx.effect('coin', ...)` needs T0019's `coin` effect in `EFFECTS`; build T0019 first and copy its call exactly.
- The crown's leader's gem does not exist yet (T0014, todo): when it lands, its drop line must use `'event-gem'`; not built here.

### Tests
- none (content is tested automatically by engine/tests/).

## Result (attempt 1, desktop)

Event gems now pay 1 coin when a human collects them, on top of their unchanged xp. New pickup `event-gem` (yellow star, vs the monster's green diamond) in `src/content/pickups/event-gem.ts`, registered in `pickups/index.ts`; gem rain and gem geyser drop it (rain 2 xp, geyser 4 xp, same as before), and the gem rush winner gets 12 coins with a single 12-coin coin pop at the first gem (its gems stay value-0 plain gems so each pickup collects silently). Monster drops and the crown's knockout bounty are untouched, and bots get neither coins nor the pop.

- Self-review: APPROVE
- Time: 7.0 min
- Self-review made fixes (kept; checks pass).

```
.../draft-arena/game/src/content/directors/crown.ts     |  2 +-
 .../game/src/content/directors/gem-geyser.ts            |  2 +-
 .../draft-arena/game/src/content/directors/gem-rain.ts  |  2 +-
 .../draft-arena/game/src/content/directors/gem-rush.ts  |  4 ++++
 .../draft-arena/game/src/content/pickups/event-gem.ts   | 17 +++++++++++++++++
 projects/draft-arena/game/src/content/pickups/index.ts  |  2 ++
 6 files changed, 26 insertions(+), 3 deletions(-)
```
