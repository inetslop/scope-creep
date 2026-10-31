---
id: T0107
title: "Ring: a 150-coin pattern, a light ring around the middle of the body"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T17:49:52Z
epic: E22
---

## Goal
The pattern shelf's tenth and last step: a light ring around the middle of the body, so the shelf's price ladder (30, 30, 40, 40, 50, 60, 80, 100, 120) gets its top step at 150 and E22 is done.

## Details
- Name "Ring", a pattern, 150 coins, no prestige. One line for the shop: "A light ring around the middle of the body."
- Look: one hollow ring (a stroke only, no fill) centred on the middle of the body, painted in the light shade of the player's own color — the same light shade the other light patterns use (`shade(w.color, 0.35)`), ring radius about a third of the body's radius. One bold ring, nothing else; the face stays clear and the outline goes on top like every pattern.
- It must read on all 10 player colors at the player's size (36 units across).
- Closest examples: `src/content/patterns/star.ts` (a 100-coin light pattern, one shape in the middle) and `src/content/patterns/bands.ts` (the light shade). New file `src/content/patterns/ring.ts`, registered in `src/content/patterns/index.ts` so the shelf stays price-ascending (after the 120-coin Cheeks if it has landed, else after the 100-coin Star).
- Buying, wearing, persistence, bot dressing and the preview all come from the generic pattern iteration; nothing in play changes (no stats, no size).

## Compared with what exists

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes across the body | two filled horizontal bands across the whole body; Ring is one hollow circle in the middle |
| Spots | dots on the body | five small dark dots scattered; Ring is one light ring, not dots |
| Belly | a light round patch | a filled patch on the lower body; Ring is hollow, centred, and higher |
| Party | a light shape on the body | a zigzag across the top; Ring is a circle around the middle, not a line across the top |
| Halves | a light area of the body | the whole top half painted lighter; Ring is a thin ring, the rest of the body is untouched |
| Diagonal | light stripes | two diagonal stripes across the body; Ring is round, not stripes |
| Lolly | a light swirl in the middle | a spiral filled across the body; Ring is one even circle, no spiral |
| Star | one light shape in the middle | a filled five-point star; Ring is hollow and round, no points |
| Cheeks (T0105, lands this cycle) | two light dots on the face | dots beside the mouth; Ring is on the body's middle, the face stays clear |

## Acceptance criteria
- [ ] "Ring" is in the Cosmetics panel's pattern row at 150 coins; buying it spends 150 coins and it wears on the preview critter and in the match, kept for the next visit.
- [ ] The ring reads on every one of the 10 player colors (light shade of the own color, hollow, centred on the middle of the body) and the face stays easy to see.
- [ ] Bots wear it at random like every pattern.
- [ ] Nothing in play changes: no stats, no size, no behavior.

## Design (architect, yoga)

### Files
- create `src/content/patterns/ring.ts` - the Ring pattern def, exactly as below
- edit `src/content/patterns/index.ts` - one import + one registry line

### Interfaces
No new types. Uses the existing `PatternDef` (`id, name, description, price, draw(g, w)`); no `prestige` field.

### Steps
1. Create `src/content/patterns/ring.ts` with exactly this content (mirror of `star.ts`, stroked like `lolly.ts`):
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const ring: PatternDef = {
  id: 'ring',
  name: 'Ring',
  description: 'A light ring around the middle of the body.',
  price: 150,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = shade(w.color, 0.35);
    g.lineWidth = 0.18 * r;
    g.beginPath();
    g.arc(0, 0, r / 3, 0, 2 * Math.PI);
    g.stroke();
  },
};
```
2. In `src/content/patterns/index.ts`: add `import { ring } from './ring.ts';` after the `star` import, and `ring,` as the last entry of `PATTERNS` (150 is the top price, so it always comes last: after `star,` — or after T0105's `cheeks,` line if that has landed).

### Pitfalls
- Hollow means **stroke only**: never call `g.fill()` (a fill would paint the whole disc).
- No ink stroke, no face — the engine draws the outline and face on top of every pattern; do not add them.
- `lineWidth` is relative (`0.18 * r`, the lolly idiom), not pixels; ring radius is `r / 3`.
- Keep `ring,` last in `PATTERNS` so the shelf stays price-ascending (150 is the max).
- Nothing in play changes: no stats, no size, no behavior; no `Math.random`/`Date` anywhere (draw is pure canvas state).

### Tests
none (no pure helpers; content is tested automatically by engine/tests/).
