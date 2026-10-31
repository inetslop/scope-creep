---
id: T0033
title: "Jackpot: one big gem in the middle of the field, worth 25 xp"
assignee: desktop-4070
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T06:30:37Z
claimed_at: 2026-10-31T08:08:31Z
finished_at: 2026-10-31T08:32:42Z
epic: E10
---

## Goal
A 5th field event and a new kind of reason to move: one big gem, worth about a level and a half, lands in the middle of the field — a prize you go to, and a fight over it that shakes the scoreboard.

## Details
The closest examples are the Gem rush and Gem geyser directors (src/content/directors/). One new director file and one new pickup file, each registered in its index; it reuses the existing ring effect (the yellow ring with an ink rim) and the existing pop effect (confetti burst).
- When and where: at 45 s, and every 150 s after the last one landed, one big gem drops at a random spot in the central 1000x1000 of the field. It stays 20 s, then pops. At most one jackpot gem is on the field at a time; the director adds nothing else (no monsters, no fields).
- The gem: a new pickup, the normal gem's look scaled three times with a small star sparkle at one corner, yellow, ink outline, worth 25 xp (about six Puffs, or the geyser's whole 8-second burst in one grab — at mid-life that is a level and a half and a talent point). It is picked up like a gem: it flies to you inside your pickup range.
- What players see: on landing, a ring blooms out from the spot and a puff of confetti pops; while it lasts, the big gem sits on the field; when it expires, it pops into confetti where it is.
- With 6 players: one gem and half the field wants it — players cross the field for it, and a fight over it is a knockout worth the crown. With 60: a scramble to the middle; the gem usually goes to whoever is there first, and the rest fight over who gets the next one.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems | The rain is a windfall that lands around one player and is shared; the jackpot is one big prize you must go to, and whoever grabs it takes all |
| Gem geyser | a gem on the ground at one spot | The geyser is a slow drip you hold for 8 s; the jackpot is one instant prize that is gone in 20 s, so holding the spot is not enough — you have to be there at the moment |
| Gem rush | a race for gems | The rush is a line of small gems laid across the field, first touch takes all twelve; the jackpot is a single big gem in the middle that anyone can contest for 20 s |
| Swarm surge | runs on a timer | The surge is a threat you dodge; the jackpot is a prize you chase |
| The crown | turns the leaderboard into a target | The crown follows the top scorer; the jackpot is a spot players fight over, and grabbing it can steal the crown |

## Acceptance criteria
- [ ] At 45 s, and every 150 s after the last one landed, a yellow gem about three times the size of a normal gem lands in the central part of the field with a ring and a puff of confetti.
- [ ] Picking it up gives 25 xp — the xp bar jumps about a level and a half at mid-life.
- [ ] If nobody takes it within 20 s it pops into confetti; at most one jackpot gem is on the field at a time.
- [ ] Nothing else on the field changes because of it: no new monsters, no new fields, no HUD.

## Design (architect, yoga)

### Files
- create `src/content/pickups/jackpot.ts` — the jackpot pickup: `id: 'jackpot'`, radius 21 (3× the gem's 7), `life: 20`, yellow diamond look + small white star sparkle, `collect` gives `value` xp (exactly like `src/content/pickups/gem.ts`)
- create `src/content/directors/jackpot.ts` — the Jackpot director: at 45 s and every 150 s after the last land, one 25-xp jackpot pickup at a random spot in the central 1000×1000; ring + confetti on landing, confetti pop on expiry (model on `src/content/directors/gem-geyser.ts`)
- edit `src/content/pickups/index.ts` — add `import { jackpot } from './jackpot.ts';` and one line `jackpot,` next to `gem,`
- edit `src/content/directors/index.ts` — add `import { jackpot } from './jackpot.ts';` after the gem-geyser import and one line `jackpot,` after `gemGeyser,`

### Interfaces
No new types; both defs are plain instances of existing interfaces:
```ts
// src/content/pickups/jackpot.ts — PickupDef from engine/api.ts: { id, radius, life, look, collect }
export const jackpot: PickupDef;
// src/content/directors/jackpot.ts — DirectorDef: { id, name, description, tick(ctx, mem) }
export const jackpot: DirectorDef;
```

### Steps
1. Create `src/content/pickups/jackpot.ts`:
```ts
import { drawCritter, traceShape, type Look, type PickupDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The jackpot: the normal gem's look three times over, with a small star sparkle at one corner. */
const look: Look = { shape: 'diamond', color: PALETTE.yellow };
look.draw = (g, e) => {
  drawCritter(g, look, e, { ink: PALETTE.ink, glint: true });
  g.save();
  g.translate(0, -e.radius);
  g.beginPath();
  traceShape(g, 'star', 5);
  g.fillStyle = PALETTE.white;
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.restore();
};

export const jackpot: PickupDef = {
  id: 'jackpot',
  radius: 21,
  life: 20,
  look,
  collect(ctx, p, value) {
    ctx.giveXp(p, value);
  },
};
```
2. Create `src/content/directors/jackpot.ts`:
```ts
import type { DirectorDef } from '../../../engine/api.ts';

const FIRST = 45;
const EVERY = 150;
const LIFE = 20;
const XP = 25;
const GEM_R = 21;

/** At 45 s and 150 s after the last one landed: one big gem worth 25 xp lands in the middle of the field. It lasts 20 s, then pops where it is. At most one on the field at a time. */
export const jackpot: DirectorDef = {
  id: 'jackpot',
  name: 'Jackpot',
  description: 'A big gem worth 25 xp lands in the middle of the field and lasts 20 s.',
  tick(ctx, mem) {
    if (mem.phase === 1) {
      if (ctx.time - mem.start >= LIFE) {
        mem.phase = 0;
        for (const p of ctx.players()) {
          if ((p.x - mem.x) ** 2 + (p.y - mem.y) ** 2 < (p.stats.pickup + GEM_R) ** 2) return;
        }
        ctx.effect('pop', { x: mem.x, y: mem.y }, undefined, GEM_R);
      }
      return;
    }
    if (ctx.time < (mem.next ?? FIRST)) return;
    mem.next = ctx.time + EVERY;
    mem.start = ctx.time;
    mem.phase = 1;
    const c = ctx.rules.world.width / 2;
    mem.x = ctx.rng.range(c - 500, c + 500);
    mem.y = ctx.rng.range(c - 500, c + 500);
    ctx.dropPickup('jackpot', mem.x, mem.y, XP);
    ctx.effect('ring', { x: mem.x, y: mem.y });
    ctx.effect('pop', { x: mem.x, y: mem.y }, undefined, GEM_R);
  },
};
```
3. Register: the two one-line registry edits above (pickup next to `gem,`; director after `gemGeyser,`).
4. `npm run check`.

### Pitfalls
- The engine has no pickup query, so the expiry pop is timed by the director: at 20 s the pickup dies itself (its `life: 20`) and the pop plays unless a player is inside their pickup range of the spot (heuristic mirrors gem-rush's distance check) — a player dashing in at the exact expiry tick can get both pop and collect; cosmetic only, do not "fix" it.
- No `Math.random`/`Date` in content — only `ctx.rng` (lint enforced); `mem` is `Record<string, number>`, no objects.
- `look.draw` fully replaces the engine's drawing: it must start with `drawCritter(g, look, e, { ink: PALETTE.ink, glint: true })` (same call the engine makes for pickups, `engine/client/render.ts:181`), then add the star; a throwing draw fails the content tests.
- One pickup and two one-shot effects per 150 s: no bandwidth or 60-player budget concern; `players()` is looped once per expiry only.
- Do not touch `gem.ts`, `effects/`, `rules.ts` or any other file — this adds nothing besides the two new items and their registry lines.

### Tests
none (content is tested automatically by `engine/tests/`).

## Result (attempt 1, desktop-4070)

Added the "Jackpot" field event — a 5th director (`src/content/directors/jackpot.ts`) that at 45 s and every 150 s after the last one lands drops a single big yellow gem (radius 21, 3× the normal gem) worth 25 xp into the central 1000×1000, with a ring + confetti on landing and a confetti pop when it expires at 20 s. The gem is a new pickup (`src/content/pickups/jackpot.ts`, id `jackpot`) drawn as the gem's look three times over with a small white star sparkle at a corner; it's collected like a gem and flies to you in range. At most one jackpot gem exists at a time, and it adds no monsters, fields, or HUD. Both items are registered in their folder's `index.ts`.

- Self-review: APPROVE
- Time: 24.2 min

```
.../game/src/content/directors/index.ts            |  2 ++
 .../game/src/content/directors/jackpot.ts          | 36 ++++++++++++++++++++++
 .../draft-arena/game/src/content/pickups/index.ts  |  2 ++
 .../game/src/content/pickups/jackpot.ts            | 28 +++++++++++++++++
 4 files changed, 68 insertions(+)
```
