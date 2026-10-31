---
id: T0047
title: "Prestige stars: a gold star on the critter per prestige this life, up to 3"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T08:32:32Z
claimed_at: 2026-10-31T09:16:15Z
finished_at: 2026-10-31T10:23:46Z
epic: E7
---

## Goal
A visible, powerless mark of how many times you've prestiged this life, so a veteran's critter reads in a crowd and prestiging again is worth it for the mark, not only the coins.

## Details
- When a player prestiges, one small gold star appears just off the top-right of their critter, to the side — below the name and clear of the crown, so it never covers either. Each additional prestige this life adds one more star, fanning out to the side: 1st prestige → 1 star, 2nd → 2 stars, 3rd → 3 stars (the cap; 4th and beyond stay at 3).
- The stars stay for the rest of the life and are gone after a knockout (a knockout resets prestiges this life, so the stars clear with it).
- No stats: the stars give no hp, speed, or damage. Right after a prestige a player is at level 1 with only the free Bolt rank — no stronger than a brand-new player and weaker than a level-17 player in every stat; the stars add nothing to that.
- How it is seen: the player sees their own stars beside their critter, and every other player sees them too (like the crown). The prestige ring (T0023) still marks the moment; the stars persist after it fades.
- It is never untouchable: a starred critter is a target worth hunting (it has spent a life prestiging), not a shield.

## Acceptance criteria
- [ ] After a player's 1st prestige this life, one small gold star shows beside their critter; the 2nd adds a second and the 3rd a third (cap 3), fanning to the side and never covering the name or the crown.
- [ ] The stars give no stats: a prestiged player's hp, speed and damage are the same as any level-1 player with only the free Bolt rank.
- [ ] The stars persist for the rest of the life and disappear when the player is knocked out (prestiges this life reset).
- [ ] Other players can see the gold stars on a prestiged critter in a crowd.

## Design (architect, desktop)

### Files
- create `src/content/areas/prestige-stars.ts` - `AreaDef` `prestige-stars`: a marker that follows a player, draws 1–3 small gold stars off the top-right of the head (count read from the area's `slots[0]`).
- create `src/content/directors/prestige-stars.ts` - `DirectorDef` `prestige-stars`: fires that area once per player per life when `player.prestige > 0`, clears the bookkeeping on knockout.
- edit `src/content/areas/index.ts` - one import line + one `AREAS` line, next to `crown` (import after line 3, list entry after `crown,`).
- edit `src/content/directors/index.ts` - one import line + one `DIRECTORS` line, next to `prestigeRing` (import after line 3, list entry after `prestigeRing,`).

### Interfaces
No new types. Two new defs, copied from the closest examples (`areas/crown.ts`, `directors/crown.ts`):

```ts
// src/content/areas/prestige-stars.ts
import { traceShape, type AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { RULES } from '../rules.ts';

export const prestigeStars: AreaDef = {
  id: 'prestige-stars',
  radius: 1,
  life: 86400, // one whole life; follow: true ends it sooner on a knockout
  interval: 1, // pulse refreshes the count (2nd/3rd star appears within 1 s)
  follow: true,
  look: {
    shape: 'circle',
    color: PALETTE.yellow,
    draw(g, e) {
      const r = RULES.player.radius; // top of the head is y = -r; the crown (areas/crown.ts) is at x -13..13, y -30..-42
      const n = Math.min(3, e.slots[0] ?? 0);
      for (let i = 0; i < n; i++) {
        g.save();
        g.translate(r + 6 + i * 9, -(r + 5) - i * 6); // fan up-right, clear of the crown, under the name
        g.beginPath();
        traceShape(g, 'star', 5, 0);
        g.fillStyle = PALETTE.yellow;
        g.fill();
        g.lineWidth = 2;
        g.lineJoin = 'round';
        g.strokeStyle = PALETTE.ink;
        g.stroke();
        g.restore();
      }
    },
  },
  pulse(_ctx, a) {
    a.slots[0] = a.owner.type === 'player' ? Math.min(3, a.owner.prestige) : 0;
  },
};
```

```ts
// src/content/directors/prestige-stars.ts
import type { Ctx, DirectorDef } from '../../../engine/api.ts';

export const prestigeStars: DirectorDef = {
  id: 'prestige-stars',
  name: 'Prestige stars',
  description: 'One gold star per prestige this life (up to 3), fanned off the top-right of the critter.',
  tick(ctx, mem) {
    for (const p of ctx.players()) {
      const key = 'stars' + p.id;
      if (p.prestige > 0 && !mem[key]) {
        mem[key] = 1;
        ctx.area(p, 'prestige-stars');
      }
    }
  },
  onKill(ctx, mem, _killer, victim) {
    if (victim.type !== 'player') return;
    delete mem['stars' + victim.id];
  },
};
```

Like the crown (the only other per-player marker: an area the director keeps attached), but the crown is one wearer and re-fired every tick; here any number of players can wear it, so fire once per life instead (see Pitfalls). The stars give no stats — nothing touches `Stats`, upgrades or levels.

### Steps
1. Create `src/content/areas/prestige-stars.ts` exactly as above.
2. Create `src/content/directors/prestige-stars.ts` exactly as above.
3. Edit `src/content/areas/index.ts`: add `import { prestigeStars } from './prestige-stars.ts';` right after the `crown` import, and add `prestigeStars,` right after the `crown,` line in `AREAS`.
4. Edit `src/content/directors/index.ts`: add `import { prestigeStars } from './prestige-stars.ts';` right after the `prestigeRing` import, and add `prestigeStars,` right after the `prestigeRing,` line in `DIRECTORS`.
5. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT copy the crown's re-fire-every-tick pattern: it is fine for one wearer, but with several prestiged players it puts 3 fresh area entities on the wire per tick per player and can blow the 60-player byte budget. Fire once; the 1-s `interval` pulse keeps `slots[0]` current, and the follow-area's own death on knockout handles the reset.
- The `mem` flag must be deleted in `onKill`: the area dies with its owner, but without the delete a respawned player (same player id, `prestige` back to 0) would never get stars again.
- Placement uses `RULES.player.radius`, not `e.radius` — `e` is the area's own view (radius 1), as in `areas/crown.ts`.
- The first pulse runs the tick after spawn, so `slots[0]` may be 0 for one snapshot: the star pops in within 50 ms, that is fine.
- `draw()` must never throw (a throw disables the area for the whole match and fails the tests); read only `e.slots`, no randomness.
- A 24 h life is the cap: if an area ever expires, stars vanish for the rest of that life — cosmetic only, and no life should last that long.

### Tests
- none (content is tested automatically by engine/tests/).

## Result (attempt 1, asus)

Added prestige stars: a `prestige-stars` area (src/content/areas/prestige-stars.ts) draws 1–3 small gold stars fanned off the top-right of a critter's head, count synced on slots[0] and refreshed by a 1-second pulse; a `prestige-stars` director (src/content/directors/prestige-stars.ts) fires it once per player per life when `player.prestige > 0` and clears its flag on a knockout so stars reset with the life. Both registered one line each in AREAS and DIRECTORS next to crown/prestigeRing. The stars are purely cosmetic — no stats — and persist until a knockout. Check and smoke (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 67.5 min
- Self-review made fixes (kept; checks pass).

```
.../draft-arena/game/src/content/areas/index.ts    |  2 ++
 .../game/src/content/areas/prestige-stars.ts       | 42 ++++++++++++++++++++++
 .../game/src/content/directors/index.ts            |  2 ++
 .../game/src/content/directors/prestige-stars.ts   | 26 ++++++++++++++
 4 files changed, 72 insertions(+)
```
