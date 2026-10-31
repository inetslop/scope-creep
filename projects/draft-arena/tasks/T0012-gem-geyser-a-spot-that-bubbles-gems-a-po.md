---
id: T0012
title: "Gem geyser: a spot that bubbles gems, a position to hold"
assignee: cachyos-x8664
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T03:16:43Z
claimed_at: 2026-10-31T05:40:15Z
epic: E3
---

## Goal
The first position event: a spot on the field marks itself, then bubbles a gem every second for 8 s — a place worth standing on, defending, and baiting a fight over. The only event that gives a place to hold, rather than a prize to grab or a threat to dodge.

## Details
- New director file `src/content/directors/gem-geyser.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new pickup: it drops the existing gem, each worth 4 xp — the same value a Puff's gem is worth.
- When it comes: 90 s in, and every 120 s after. Where: a random point at least 300 units inside the field's edges; a different spot each time.
- What it adds, in order: a 2 s warning — a ring of bubbles rising up at the spot (new effect file `src/content/effects/geyser-bubble.ts`, closest example: `src/content/effects/pop.ts`) — then the geyser itself: a yellow-green ring pulses on the ground at the spot for 8 s, and every 1 s a gem worth 4 xp drops in the middle of it. 8 gems, 32 xp total — worth a fight at any point in a life.
- What players see: the bubbles, then a pulsing ring marking the spot for 8 s — each next gem lands in the middle of the ring, so the spot is readable from the edge of the screen and a player can plan a path to it, or an ambush on whoever stands there.
- Holding it: a player who stands at the spot (within pickup range 90) collects each gem as it lands. The spot itself does not hurt; the only thing between you and all 32 xp is whoever else is there. A fight over the geyser pays the usual pvp stakes: a knockout gives 25 score and 4 xp per level of the victim.
- With 6 players: one player or a bot usually takes most of the eight gems; a player who spots the warning can camp the spot or gank the camper. With 60: the spot becomes a rally point — players gather around it, fights break out over it, and its 32 xp is usually split or stolen.
- It doesn't swamp the field: 8 gems per geyser, every 120 s, one spot at a time — if the timer lands while a geyser is still running, it simply waits for the next 120 s.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems for players to collect | Rain is an instant windfall around one player — grab it fast and move on; the geyser holds one marked spot for 8 s, a position a player can stand on, defend and bait a fight over — a reason to be somewhere, not just to grab something |
| Gem rush (T0011, in the pool) | gems that make players run across the field | The rush's line is a race — first touch takes all and it is over in a moment; the geyser's spot lasts 8 s, so it can be held, camped and defended, and the fight over it can outlast the geyser |

## Acceptance criteria
- [ ] At 90 s (and every 120 s after), a spot at least 300 units inside the edges shows a 2 s ring of bubbles, then a yellow-green ring pulses there for 8 s.
- [ ] During the 8 s, a gem worth 4 xp drops in the middle of the ring every 1 s — 8 gems, 32 xp total; a player standing within pickup range collects them as they land.
- [ ] One player holding the spot takes all eight gems; an enemy player who knocks them out there gets the usual 25 score and 4 xp per level of the victim, and can collect the remaining gems.
- [ ] The geyser never overlaps itself: while one is running, the timer waits for the next 120 s.
- [ ] When the 8 s end, the ring stops and no more gems drop; the next geyser comes at a different spot.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.

## Design (architect, desktop)

### Files
- create `src/content/directors/gem-geyser.ts` - the geyser director (copy `gem-rain.ts` shape)
- create `src/content/effects/geyser-bubble.ts` - one 10 s effect: 2 s of rising bubbles, then a pulsing lime ring (copy `pop.ts` style, `ring.ts` for the ring strokes)
- edit `src/content/directors/index.ts` - one import + `gemGeyser,` right after `gemRain,`
- edit `src/content/effects/index.ts` - one import + `geyserBubble,` right after `ring,`

### Interfaces
No new types. Two content defs, registered in `DIRECTORS` and `EFFECTS`:
- `gemGeyser: DirectorDef` (`id: 'gem-geyser'`), only a `tick(ctx, mem)` hook.
- `geyserBubble: EffectDef` (`id: 'geyser-bubble'`, `duration: 10`), one `ctx.effect('geyser-bubble', { x, y })` call per geyser.
No new pickup: it drops the existing `gem` with value 4 (`gem.collect` already gives that xp).

### Steps
1. Create `src/content/directors/gem-geyser.ts` exactly:
```ts
import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 90; const EVERY = 120; const WARN = 2; const GEMS = 8; const XP = 4; const MARGIN = 300;

/** At 90 s and every 120 s: a marked spot bubbles for 2 s, then a ring holds it for 8 s, a gem worth 4 xp in the middle every second. */
export const gemGeyser: DirectorDef = {
  id: 'gem-geyser',
  name: 'Gem geyser',
  description: 'A spot bubbles, then drops a gem every second for 8 s. Hold it.',
  tick(ctx, mem) {
    if ((mem.phase ?? 0) === 1) {
      const age = ctx.time - mem.start;
      if (age >= WARN) {
        while (mem.drops < GEMS && age >= WARN + mem.drops) {
          mem.drops += 1;
          ctx.dropPickup('gem', mem.x, mem.y, XP);
        }
      }
      if (age >= WARN + GEMS) mem.phase = 0;
      return;
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    mem.phase = 1;
    mem.start = ctx.time;
    mem.drops = 0;
    mem.x = ctx.rng.range(MARGIN, ctx.rules.world.width - MARGIN);
    mem.y = ctx.rng.range(MARGIN, ctx.rules.world.height - MARGIN);
    ctx.effect('geyser-bubble', { x: mem.x, y: mem.y });
  },
};
```
2. Create `src/content/effects/geyser-bubble.ts` exactly:
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const WARN = 2; const RING = 8;

/** Geyser: 2 s of bubbles rising in a ring at the spot, then a pulsing lime ring holds the spot 8 s, one pulse per gem. */
export const geyserBubble: EffectDef = {
  id: 'geyser-bubble',
  duration: WARN + RING,
  draw(g, fx) {
    if (fx.age < WARN) {
      const rise = fx.age / WARN;
      g.globalAlpha = 1 - rise * 0.8;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
        const y = fx.ay + Math.sin(a) * 70 - rise * (30 + 25 * noise(fx.seed, i + 10));
        g.fillStyle = PALETTE.white;
        g.strokeStyle = PALETTE.ink;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(fx.ax + Math.cos(a) * 70, y, 4 + 3 * noise(fx.seed, i + 20), 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      return;
    }
    const ringT = (fx.age - WARN) / RING;
    g.globalAlpha = ringT < 0.875 ? 1 : (1 - ringT) / 0.125;
    const r = 74 + 8 * (1 - ((fx.age - WARN) % 1));
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = PALETTE.lime;
    g.stroke();
  },
};
```
3. Add to `src/content/directors/index.ts`: import `{ gemGeyser } from './gem-geyser.ts';` and the line `gemGeyser,` after `gemRain,`.
4. Add to `src/content/effects/index.ts`: import `{ geyserBubble } from './geyser-bubble.ts';` and the line `geyserBubble,` after `ring,`.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `mem` is `Record<string, number>`: store the spot as `mem.x`/`mem.y` numbers, never a point object.
- Never write `mem.start === undefined` (TS2367: `number` and `undefined` have no overlap); the `mem.phase` key plus `?? 0` is the idiom (same as `mem.next ?? FIRST` in gem-rain).
- Engine tests call effect `draw` with `t` 0/0.5/1 and `age = t * duration` (so ages 0, 5, 10) on a stub: it must not throw or produce NaN; the fade formula above is safe at `ringT = 1` (alpha 0).
- Server randomness only from `ctx.rng`; in `draw` only `noise(fx.seed, i)` and pure math — no `Math.random`.
- Gems must land exactly at `mem.x`/`mem.y`; pickup range (90) and PvP stakes (25 score, 4 xp/level) are engine behavior — do not re-implement them.
- The ring pulses once per second via `1 - ((fx.age - WARN) % 1)`, synced to tick time on every client — do not use per-frame timers or `Date`.
- Cost is 1 effect event + 8 pickups per 120 s: no bandwidth concern. Use `ctx.rules.world` for the margin, don't hardcode 4000.
- Registries are one-line additions; do not touch gem-rain or other content.

### Tests
none (content is tested automatically by engine/tests/: effect draw at t 0/0.5/1, directors in a 180 s match, file/registry rules).
