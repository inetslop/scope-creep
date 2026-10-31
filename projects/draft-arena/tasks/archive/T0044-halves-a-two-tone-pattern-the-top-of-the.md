---
id: T0044
title: "Halves: a two-tone pattern, the top of the body lighter"
assignee: inet-racing
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T08:05:11Z
claimed_at: 2026-10-31T09:34:34Z
finished_at: 2026-10-31T09:45:07Z
epic: E6
---

## Goal
A third price step in the shop's patterns: a two-tone critter that reads at a glance in a crowd.

## Details
- New pattern file src/content/patterns/halves.ts (one file, drawn like src/content/patterns/belly.ts — the closest example, also a light shape on the body), registered in src/content/patterns/index.ts with the other patterns.
- Name: Halves. Description: "The top half of the body, lighter, like a two-tone critter." Price: 50 coins, no prestige gate.
- How it looks: the top half of the body, painted lighter than the player's own color (the same light shade the other light patterns use), clipped to the body with a straight cut across the middle; the outline and the face go on top, as with every pattern. One bold cut, no fine detail.
- It must read on all 10 player colors and at a player's size (36 units across).
- Price against what a match earns: a match pays 1 coin per monster kill, the victim's level per player knockout and 1 per event gem, so a few coins a match — 50 coins is a few matches, between the 40-coin patterns and the 80-coin accessories.
- The shop picks it up from the pattern registry: it shows in the shop's pattern row at its 50-coin price; buying, wearing and taking it off work exactly as with the other patterns, and a bought Halves is kept in the profile for the next visit.
- Counts: 5 of the 12 patterns.

## Acceptance criteria
- [ ] The shop's pattern row shows Halves at 50 coins with its description; a player who can afford it buys it, and it is still owned on the next visit.
- [ ] Wearing Halves paints the top half of the player's body lighter than its own color, with a straight cut across the middle, on every one of the 10 player colors, outline and face on top.
- [ ] Bots wear Halves at random with the other patterns, seen in the match.
- [ ] It reads at a glance on a critter of 36 units in a crowd: one bold two-tone split, distinct from the bands, the spots, the belly patch and the party zigzag.

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes across the body | two thin bands across the whole body; Halves is one bold cut that paints the entire top half |
| Spots | shapes in the player's own color | five separate dots; Halves is one continuous half, not dots |
| Belly | a light patch on the body | a small round patch on the lower body; Halves is the whole top half, a straight cut, the opposite placement |
| Party | light shapes near the top | a zigzag line across the top; Halves is a solid filled half, not a line |

## Design (architect, yoga)

### Files
- create `src/content/patterns/halves.ts` - the new pattern `halves`, drawn like `src/content/patterns/belly.ts` (the closest example: a light shape on the body)
- edit `src/content/patterns/index.ts` - one import line + one registry line for `halves`

### Interfaces
None new; `PatternDef` is unchanged. The shop (`src/menu/shop.ts`), bot wearing and profile persistence all read the `PATTERNS` registry through the content bundle (`patterns: PATTERNS` in `src/content/index.ts:27`) — no shop/menu/engine edits needed.

### Steps
1. Create `src/content/patterns/halves.ts` exactly:
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const halves: PatternDef = {
  id: 'halves',
  name: 'Halves',
  description: 'The top half of the body, lighter, like a two-tone critter.',
  price: 50,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.arc(0, 0, r, Math.PI, 0);
    g.closePath();
    g.fill();
  },
};
```
2. Edit `src/content/patterns/index.ts`: add `import { halves } from './halves.ts';` after the `party` import, and add `halves,` as the last line of the `PATTERNS` array (after `party,`). Do not reorder the existing lines.

### Pitfalls
- Arc direction: canvas y is down; `g.arc(0, 0, r, Math.PI, 0)` sweeps through the top (π → 3π/2 → 2π) and `closePath()` closes with the straight cut along y = 0. Writing the angles in the other order paints the bottom half.
- No `drawCritter()`, no outline, no face — the pattern paints only over the body; the engine draws the ink outline and the face on top (as with `belly`/`party`).
- Color is `shade(w.color, 0.35)` (the same light shade the other light patterns use), never a PALETTE entry and never the raw color — it must read on all 10 player colors.
- No `prestige` field (50 coins, ungated). One file, one item, named after the id; nothing else in it.
- Do not touch `belly.ts`, `party.ts`, the shop or `base.css`.

### Tests
none (engine/tests/ checks the pattern is registered, draws, and the 12-pattern cap automatically; this makes it 5 of 12).

## Result (attempt 1, inet-racing)

Added the "Halves" two-tone pattern (`src/content/patterns/halves.ts`): one bold cut painting the top half of the body in `shade(w.color, 0.35)` (the same light shade as the other light patterns), so it reads on all 10 player colors with the engine's outline and face drawn on top. Registered it as the 5th of 12 patterns in `src/content/patterns/index.ts` (one import, one line, existing order untouched); the shop, bot wearing, and profile persistence pick it up from the registry with no other edits. Priced at 50 coins, no prestige gate. `npm run check` (86 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 10.6 min

```
projects/draft-arena/game/src/content/patterns/halves.ts | 16 ++++++++++++++++
 projects/draft-arena/game/src/content/patterns/index.ts  |  2 ++
 2 files changed, 18 insertions(+)
```
