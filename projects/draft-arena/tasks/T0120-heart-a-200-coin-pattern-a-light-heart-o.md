---
id: T0120
title: "Heart: a 200-coin pattern, a light heart on the middle of the body"
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T20:09:56Z
claimed_at: 2026-10-31T20:45:42Z
epic: E26
---

## Goal
The pattern shelf gets its 12th and final item (the cap): a light heart on the middle of the body, the shelf's step past Smile's 180.

## Details
- **Heart** is a pattern, **200 coins, no prestige lock**. Name "Heart" (5 characters), description "A light heart on the middle of the body."
- **New file `src/content/patterns/heart.ts`** — the closest example is `src/content/patterns/star.ts` (one light shape on the middle of the body). Register it in `src/content/patterns/index.ts` the same way: one import and one registry line, placed in price order (after Smile).
- **Look:** one **light heart** on the middle of the body — filled with the player's own color lightened via `shade(w.color, 0.35)`, the same light shade the other light patterns use, bold enough to read at a player's size (about 0.6 of the body's radius wide, dip of the heart just above the body's middle). Clipped to the body like every pattern; the ink outline and the face are drawn on top, so the face stays easy to see.
- The pattern shelf becomes: 30 (Bands, Spots), 40 (Belly, Party), 50 (Halves), 60 (Diagonal), 80 (Lolly), 100 (Star), 120 (Cheeks), 150 (Ring), 180 (Smile), **200 (Heart)** — 12 patterns, the cap. No gap bigger than 150 between 80 and 400.

## Compared with what exists
One row for every pattern:

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | a light pattern on the body | two horizontal bands across; Heart is one heart in the middle |
| Spots | a body pattern of small marks | five dark dots scattered; Heart is one light heart in the middle |
| Belly | a light patch on the body | a round patch on the lower body; Heart is a pointed heart in the middle |
| Party | a light pattern across the top | a zigzag across the top; Heart is a heart in the middle |
| Halves | light paint over the body | the whole top half lighter; Heart is one shape in the middle |
| Diagonal | two light stripes | diagonal stripes across the body; Heart is one heart, no stripes |
| Lolly | a light swirl | a lollipop spiral across the body; Heart is a heart, no spiral |
| Star | one light shape in the middle | a five-point star in the middle; Heart is a heart in the middle, a different silhouette |
| Cheeks | two light marks | two dots on the cheeks; Heart is one shape in the middle of the body |
| Ring | a light shape in the middle | a hollow ring around the middle; Heart is a filled heart where the ring's hole is |
| Smile | a light arc on the lower body | a smile across the lower body; Heart is in the middle, a shape not an arc |

## Acceptance criteria
- [ ] The Cosmetics panel lists Heart on the pattern shelf at 200 coins; buying it spends 200 coins and paints it on the preview critter and on the player in-match; it is worn on the next visit.
- [ ] A Heart-wearing critter shows one light heart on the middle of the body in the player's own lightened color, clipped to the body, with the face still easy to see on all 10 player colors.
- [ ] It changes nothing in play; bots can wear it.
- [ ] The pattern shelf has 12 patterns (the cap); `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- create `src/content/patterns/heart.ts` - the pattern `id: 'heart'` (12th, the cap)
- edit `src/content/patterns/index.ts` - one import + one registry line for `heart`, in price order after `smile`

### Interfaces
```ts
// heart.ts — exact file content, mirror star.ts's structure:
import { shade, type PatternDef } from '../../../engine/api.ts';

export const heart: PatternDef = {
  id: 'heart',
  name: 'Heart',
  description: 'A light heart on the middle of the body.',
  price: 200,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.ellipse(-0.14 * r, -0.1 * r, 0.18 * r, 0.18 * r, 0, 0, Math.PI * 2);
    g.ellipse(0.14 * r, -0.1 * r, 0.18 * r, 0.18 * r, 0, 0, Math.PI * 2);
    g.moveTo(-0.32 * r, 0);
    g.lineTo(0.32 * r, 0);
    g.lineTo(0, 0.5 * r);
    g.closePath();
    g.fill();
  },
};
```
The heart: two round lobes (circles radius 0.18r centred ±0.14r, 0.1r above middle) + a triangle to the bottom point — a classic heart, 0.64r wide (≈0.6 of the body radius), dip at −0.21r (just above the body's middle), bottom point 0.5r down, all inside the body.

### Steps
1. Create `src/content/patterns/heart.ts` with the content above (name "Heart" is 5 chars; description exactly "A light heart on the middle of the body.").
2. In `src/content/patterns/index.ts`: add `import { heart } from './heart.ts';` after the `smile` import (line 12), and add `heart,` after `smile,` in `PATTERNS` (line 26) — price order, the shelf's last item.
3. `npm run check` and `npm run smoke`.

### Pitfalls
- `traceShape` has no `'heart'` shape — do not try `traceShape(g, 'heart', ...)`; the raw path above is the design.
- Do not call `g.fill('evenodd')`: the union only fills solidly because all three subpaths wind the same way; keep the plain `g.fill()`.
- The `moveTo` before the triangle is required (starts a new subpath, no stray line from the lobe arcs).
- No clipping/saving: the engine clips the pattern to the body and draws the ink outline and face on top, exactly like `star`; the face stays visible.
- No `prestige` field (no lock), no PALETTE color — the heart is `shade(w.color, 0.35)`, the player's own lightened color, same as star/smile.
- Touch nothing else: the shop shelf (`src/menu/shop.ts`) and the Cosmetics panel read `PATTERNS` dynamically.

### Tests
- none (engine/tests/ validates the pattern file, its registry line, its draw, and the 12-pattern cap automatically).
