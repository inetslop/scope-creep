---
id: T0105
title: "Cheeks: a 120-coin pattern, two light dots on the cheeks"
assignee: asus
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T17:29:12Z
claimed_at: 2026-10-31T18:11:15Z
epic: E22
---

## Goal
The pattern shelf's next step toward its 10th pattern: a bold, friendly pattern that reads at a glance, priced between the 100-coin Star and the 150-coin Ring that follows.

## Details
- One new pattern in a new file, registered like the others: name "Cheeks", description "Two light dots on the cheeks.", price 120 coins, no prestige.
- How it looks: exactly two light circles (the same light shade the other light patterns use, shade(w.color, 0.35)), one on each side of the mouth, centred on the lower body just below the eyes — each dot about a quarter of the body's width across, evenly mirrored so they read as a pair, like happy blushes. Clipped to the body like every pattern; the outline and the face go on top, so the eyes and mouth stay clear.
- It must read on all 10 player colors the way the light patterns do, and keep the face easy to see.
- Closest example to copy the shape of: src/content/patterns/belly.ts (one light circle clipped to the body) — this is two smaller ones, one on each side of the mouth. New file src/content/patterns/cheeks.ts plus one import and one registry line in src/content/patterns/index.ts.

## Acceptance criteria
- [ ] The Cosmetics panel's pattern row shows Cheeks at 120 coins; buying it costs 120 coins and it wears like the other patterns.
- [ ] On a critter of any of the 10 colors, exactly two light circles show on the lower body, one on each side of the mouth, bold enough to read at a player's size and clear of the eyes.
- [ ] It changes nothing in play and does not alter any existing pattern.

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light shapes across the body | two full-width horizontal bands; Cheeks is two separated dots on the lower body only |
| Spots | dots on the body | five dark dots scattered over the whole body; Cheeks is exactly two light dots, mirrored, in the face area only |
| Belly | a light round shape on the lower body | one round patch centred under the mouth; Cheeks is a pair of smaller dots, one on each side of the mouth |
| Party | a light line across the top | a zigzag along the top edge; no round shapes, nothing on the lower body |
| Halves | a light area of the body | the whole top half in one flat tone; no separate shapes |
| Diagonal | two light stripes across the body | two long stripes corner to corner; no dots, nothing on the lower body |
| Lolly | a light swirl across the body | one spiral across the middle; no dots |
| Star | one light shape in the middle of the body | a five-point star in the centre; no pair, nothing by the mouth |

## Design (architect, desktop)

### Files
- create `src/content/patterns/cheeks.ts` - the new pattern, `id: 'cheeks'`, exactly one `PatternDef`
- edit `src/content/patterns/index.ts` - one import line after the `star` import, one entry line after `star,` in `PATTERNS`

### Interfaces
Nothing new. Use the existing `PatternDef` (`engine/api.ts:576`) as-is.

### Steps
1. Create `src/content/patterns/cheeks.ts` with exactly this content (copy of `belly.ts` shape, two mirrored dots):

```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const cheeks: PatternDef = {
  id: 'cheeks',
  name: 'Cheeks',
  description: 'Two light dots on the cheeks.',
  price: 120,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    for (const side of [-1, 1]) {
      g.beginPath();
      g.arc(side * 0.45 * r, 0.55 * r, 0.25 * r, 0, Math.PI * 2);
      g.fill();
    }
  },
};
```

2. In `src/content/patterns/index.ts`: add `import { cheeks } from './cheeks.ts';` on the line after the `star` import, and add `cheeks,` on the line after `star,` in the `PATTERNS` list (it is the 9th pattern, before the 150-coin Ring).

### Pitfalls
- No `prestige` field — omit it entirely (this pattern needs no prestige).
- Dots are radius 0.25r at (±0.45r, 0.55r): each is ~a quarter of the body width across, fits fully in the body (0.96r from centre < r), and does not touch the eyes (which end at y ≈ 0.14r) — do not move them.
- Keep `shade(w.color, 0.35)` exactly as in `belly.ts`; that light shade is what reads on all 10 player colors. Do not darken, do not add glow or a second color.
- Do not edit `belly.ts`, `star.ts` or any other pattern file. The face and outline are drawn by the engine on top; the pattern must only fill.

### Tests
none (content is tested automatically by engine/tests/: registered, valid data, draws, wearable).
