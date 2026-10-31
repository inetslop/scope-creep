---
id: T0011
title: "Gem rush: a line of 12 gems across the field, first touch takes all"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T03:16:43Z
claimed_at: 2026-10-31T04:11:10Z
epic: E3
---

## Goal
A moving prize: a line of twelve gems lays itself across the field, and the first player to collect any one of them takes all twelve at once — a race where players chase the line across each other.

## Details
- New director file `src/content/directors/gem-rush.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new pickup: it drops the existing gem (the pickup every monster drops, `src/content/pickups/`), each worth 1 xp like a Dot's gem.
- When it comes: 50 s in, and every 100 s after. Where: a random straight line across the field — 12 points 75 units apart (a line 825 units long), placed so the whole line is at least 200 units inside the field's edges.
- What it adds: the gems appear one by one along the line — the first immediately, then one every 0.5 s (all 12 in 6 s) — so the line visibly lays itself across the field. Nothing moves: each gem sits where it appears.
- The race: the moment any player collects the first gem of the line, every gem of that line — already appeared or not — flies to that player at once, and the line is over. One grab takes all twelve (12 xp, a good share of a level) in a single touch. If no one collects a gem, the twelve simply sit as ordinary 1-xp gems until someone walks past.
- What players see: twelve yellow gems appearing one after another along a visible straight line — the line itself is the announcement; nothing is added to the HUD.
- With 6 players: one player (or a bot) usually takes the line with little contest — the reward for being in the right place. With 60: a race across the field through other players; the line's path becomes a corridor players run along, and a slow runner can be intercepted before the line is done.
- It doesn't swamp the field: 12 gems per rush, every 100 s, all of them either collected or sitting as ordinary gems (far under the match's 1500-pickup cap).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems for players to collect | Rain drops everything at once around a random player — you are either there when it lands or you miss it; the rush lays a line across the field for anyone — a race where the first collection takes all twelve, and the chase is the event |

## Acceptance criteria
- [ ] At 50 s (and every 100 s after), 12 gems worth 1 xp each appear one by one along a straight line 825 units across the field — one every 0.5 s, the whole line at least 200 units inside the edges.
- [ ] The first player to collect any gem of the line collects all twelve at once (not-yet-appeared gems appear and fly to them): 12 xp in one grab, and the line is over.
- [ ] Two players racing the same line: the first to collect a gem takes all twelve; the other takes nothing from that line.
- [ ] Magnet (longer pickup range) does not change the rule: a gem another player already collected is not stolen by a longer pull; first collection wins.
- [ ] An unclaimed line leaves twelve ordinary 1-xp gems on the field.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.

## Design (architect, yoga)

### Files
- create `src/content/directors/gem-rush.ts` — the director: lays 12 value-0 `gem` pickups in a straight line, pays the first grabber 12 xp (the take-all).
- edit `src/content/directors/index.ts` — import `gemRush` and add it to `DIRECTORS` after `gemRain`.

### Interfaces
None: a plain `DirectorDef`, no new types. No engine change needed — the line gems are the existing `gem` pickup dropped with `value: 0`, so its `collect` hook (`giveXp(p, value)`) gives nothing and the director alone pays out.

### Steps
1. Create `src/content/directors/gem-rush.ts`, copying the file shape of `gem-rain.ts`, with exactly this content:

```ts
import type { DirectorDef, Player } from '../../../engine/api.ts';

/**
 * Every 100 s (first at 50 s), twelve 1 xp gems lay themselves in a line across the field:
 * the first to grab any one takes all twelve. The gems are dropped with value 0, so the
 * engine's collect gives nothing; this pays the grabber instead: first grab 12 xp, the
 * rest of the line worth nothing after, and the not-yet-laid gems appear at the grabber,
 * where the engine collects them for them.
 */
const FIRST = 50;
const EVERY = 100;
const N = 12;
const GAP = 75;
const STEP = 0.5;
const MARGIN = 200;
const GEM_R = 7;

export const gemRush: DirectorDef = {
  id: 'gem-rush',
  name: 'Gem rush',
  description: 'Every 100 s, twelve gems lay themselves in a line across the field: the first to grab one takes all twelve.',
  tick(ctx, mem) {
    if (ctx.time >= (mem.next ?? FIRST)) {
      mem.next = ctx.time + EVERY;
      mem.start = ctx.time;
      mem.spawned = 0;
      mem.claimed = 0;
      const a = ctx.rng.range(0, Math.PI * 2);
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const half = ((N - 1) / 2) * GAP;
      const w = ctx.rules.world;
      const cx = ctx.rng.range(MARGIN + half * Math.abs(dx), w.width - MARGIN - half * Math.abs(dx));
      const cy = ctx.rng.range(MARGIN + half * Math.abs(dy), w.height - MARGIN - half * Math.abs(dy));
      for (let i = 0; i < N; i++) {
        mem['x' + i] = cx + (i - (N - 1) / 2) * GAP * dx;
        mem['y' + i] = cy + (i - (N - 1) / 2) * GAP * dy;
        mem['c' + i] = 0;
      }
    }
    if (mem.start === undefined) return;
    const due = Math.min(N, Math.floor((ctx.time - mem.start) / STEP) + 1);
    for (let i = mem.spawned; i < due; i++) ctx.dropPickup('gem', mem['x' + i], mem['y' + i], 0);
    mem.spawned = due;
    if (mem.claimed) return;
    for (let i = 0; i < N; i++) {
      if (mem['c' + i]) continue;
      const x = mem['x' + i];
      const y = mem['y' + i];
      let p: Player | undefined;
      let d2 = Infinity;
      for (const u of ctx.unitsNear(x, y, GEM_R)) {
        if (u.type !== 'player') continue;
        const q2 = (u.x - x) ** 2 + (u.y - y) ** 2;
        if (q2 < d2) { p = u; d2 = q2; }
      }
      if (!p) continue;
      mem['c' + i] = 1;
      mem.claimed = 1;
      ctx.giveXp(p, 12);
      for (let j = mem.spawned; j < N; j++) ctx.dropPickup('gem', p.x, p.y, 0);
      mem.spawned = N;
      break;
    }
  },
};
```

2. Edit `src/content/directors/index.ts`: add `import { gemRush } from './gem-rush.ts';` after the `gem-rain` import, and add `gemRush,` after `gemRain,` in `DIRECTORS`.
3. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Drop the line gems with value **0** (`dropPickup('gem', x, y, 0)`) — any value > 0 double-pays (the gem's `collect` would add xp on top of the director's 12).
- `ctx.unitsNear(x, y, GEM_R)` must keep `GEM_R = 7` (the gem's radius): the engine collects at `d <= 7 + player radius` and `unitsNear` adds the unit's own radius, so 7 reproduces the engine's contact exactly; any other number triggers the take-all at the wrong distance.
- Keep the `u.type === 'player'` filter (monsters are in `unitsNear`; a bot is a `Player` and may take the line — intended) and the `c0..c11` consumed flags (a player standing on a dead gem must not be paid again); reset `spawned`, `claimed` and the flags at every line start — `mem` persists across lines.
- The take-all drops the not-yet-laid gems at the grabber's position (not the line's) so they appear at the player and the engine auto-collects them; the already-laid gems within the grabber's pickup range (90) fly to them by the engine's native pull, the rest stay as ordinary-looking gems worth nothing — content cannot move or delete pickups, and the acceptance criteria hold: 12 xp in one grab, the rival takes nothing, an unclaimed line is twelve ordinary 1-xp gems.
- No HUD, no `rules.ts`/`palette.ts` edits, and no change to `src/content/pickups/gem.ts` (value-0 gems need none); 12–24 pickups per rush, far under the 1500 cap.

### Tests
- none (the engine tests run every director in a 3-minute match, the 60-player budget and the load check automatically).
