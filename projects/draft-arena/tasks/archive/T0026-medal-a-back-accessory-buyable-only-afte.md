---
id: T0026
title: "Medal: a back accessory, buyable only after 2 prestiges in all"
assignee: asus
size: S
priority: 2
status: done
depends_on: [T0022]
attempts: 1
created: 2026-10-31T05:24:06Z
claimed_at: 2026-10-31T07:48:09Z
finished_at: 2026-10-31T08:21:32Z
epic: E7
---

## Goal
The shop's longest goal: a small medal only buyable after 2 prestiges in all — the wearable that marks a returning player on the field, the prestige reward you can wear.

## Details
- One new accessory, its own file in src/content/accessories/, slot **back**: **Medal** — description "A yellow medal with a red ribbon. Needs 2 prestiges in all." — price 400, `prestige: 2` (bought only after 2 prestiges in all, the profile's count across all lives).
- Look — the back slot draws behind the body, so only what sticks out beyond the body's outline reads, and it stays below the body's centre so it never touches the name: a yellow disc, 0.55 of the body's radius, centred 1.2 radii below the body's centre, so a wide crescent of it reads below the critter; ink outline, a small white shine dot at its upper left; two short red ribbon tails peeking from behind the body at the lower left and lower right (about 0.4 radii out from the bottom centre). It sways a little with movement, the way the Candy Pack bobs. Candy colors, ink outline, no glow, no themed dressing.
- Price against what a match earns (T0019: a new player about 60–120 a match, a good one 150–250; the first stock is 30–100): 400 is about two to three good matches on top of the two prestiges — the longest goal in the shop.
- It changes nothing in play: no stats, no size. Bots have no prestiges, so bots never wear it — anyone who wears the Medal has prestiged at least twice in all, and the field marks its own regulars.
- In the shop panel (T0022) it sits with the other back items: before 2 prestiges in all it shows "Needs 2 prestiges" and cannot be bought; after, it is 400 coins. This task only adds the item; the panel and buying are T0022's.

## Compared with what exists
By the time this is designed the back slot has the Candy Pack (T0021, via T0022); if any more back item exists then, add a row for it too.
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a back item behind the body, a round thing below the centre | the pack is a wide green satchel (three quarters of the body wide) with a yellow buckle; the medal is a narrow yellow disc at the bottom centre with two red ribbon tips — a different shape, a different color, and the ribbon tells it apart at a glance |

## Acceptance criteria
- [ ] The Medal exists: slot back, 400 coins, prestige 2, a name of at most 18 characters and a one-line description.
- [ ] In the shop panel, a player with fewer than 2 prestiges in all sees "Needs 2 prestiges" on it and cannot buy it; after 2 prestiges in all it can be bought for 400 coins and, once bought, worn and taken off like the other back items.
- [ ] Worn, it reads on a 36-unit critter in a crowd: a yellow disc below the body with two red ribbon tips; it never covers the face or the name and changes nothing in play (hp, speed, radius and pickup are the same with and without it).
- [ ] No bot wears it in a fresh match.
- [ ] A bought medal is still owned on the next visit in the same browser.

## Design (architect, desktop)

### Files
- create `src/content/accessories/medal.ts` — the Medal back accessory (`id: 'medal'`, export `medal`)
- edit `src/content/accessories/index.ts` — one import line, one list line (both next to `candyPack`, the other back item)

### Interfaces
No new types. Uses existing `AccessoryDef` (`prestige?: number` is engine-supported; the shop's "Needs 2 prestiges" / `cantBuy(id)` come from the engine + T0022's panel — this task only adds the item).

### Steps
1. Create `src/content/accessories/medal.ts` with exactly this (copy of `candy-pack.ts`'s structure; the same sway formula as Candy Pack):
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const medal: AccessoryDef = {
  id: 'medal',
  name: 'Medal',
  description: 'A yellow medal with a red ribbon. Needs 2 prestiges in all.',
  slot: 'back',
  price: 400,
  prestige: 2,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.12 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    g.fillStyle = PALETTE.red;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(sway + side * 0.55 * r, 1.08 * r, 0.26 * r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(sway, 1.2 * r, 0.55 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.arc(sway - 0.2 * r, 1.13 * r, 0.1 * r, 0, Math.PI * 2);
    g.fill();
  },
};
```
2. In `src/content/accessories/index.ts`: add `import { medal } from './medal.ts';` after the `candy-pack.ts` import, and add `medal,` after `candyPack,` in `ACCESSORIES`. Add no other lines (T0017 may add cone/beanie — leave its lines alone).
3. Run `npm run check`.

### Pitfalls
- Draw order is load-bearing: ribbons first, disc second, shine last — the disc must cover the ribbon inner halves so only the tips read at the lower left/right of the disc. Do not "fix" the order.
- Shine dot: `fill()` only, no `stroke()` (it's a highlight, not a shape).
- Back slot draws behind the body (engine order): the disc top and ribbon tops are hidden on purpose; the visible crescent is below `y = r`. All points stay within 2 radii (lowest point 1.75r).
- No `Math.random`/`Date` in content (lint); all variation comes from `w.time`, `w.speed`, `w.seed`.
- Colors only from PALETTE (`yellow`, `red`, `white`, `w.ink`) — no glow, no new colors.

### Tests
none — engine/tests/ validates the accessory (one-item-per-file, registry, valid data, draw) automatically.

## Result (attempt 1, asus)

Added the Medal, a back-slot accessory (`src/content/accessories/medal.ts`) — a swaying yellow disc with a white shine and two red ribbon tips peeking from behind the body, drawn only with PALETTE colors and ink outlines. It costs 400 coins and has `prestige: 2`, so the engine only lets it be bought after a player has prestiged twice in all (bots never can). Registered it in `src/content/accessories/index.ts` next to candyPack with one import and one list line; no other files touched. `npm run check` and `npm run smoke` both pass.

- Self-review: REJECT
- Time: 33.4 min
- Self-review made fixes (kept; checks pass).
- Self-review concerns: bots dress from the whole wardrobe with no prestige filter (engine/sim/match.ts:178-185 `botWear()`), so in a fresh match ~9-20% of bots wear the Medal (verified: 18/200), breaking the "no bot wears it in a fresh match" criterion and the task's "the field marks its own regulars" premise; content cannot fix this (`Player` doesn't expose `wear`) and the engine is frozen — needs the engine owner to exclude `prestige`-gated accessories from `botWear()`.

```
.../game/src/content/accessories/index.ts          |  2 ++
 .../game/src/content/accessories/medal.ts          | 33 ++++++++++++++++++++++
 projects/draft-arena/game/tests/medal.test.ts      | 15 ++++++++++
 3 files changed, 50 insertions(+)
```

## Merge (attempt 1, asus)

- Conflicts in: projects/draft-arena/game/src/content/accessories/index.ts
- Auto-resolved 2 spot(s) where both sides only added lines (clean: projects/draft-arena/game/src/content/accessories/index.ts).
- Resolved without the conflict agent.
