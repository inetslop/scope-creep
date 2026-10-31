---
id: T0056
title: "Diagonal: a 60-coin pattern, two light diagonal stripes across the body"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T10:47:58Z
claimed_at: 2026-10-31T11:00:29Z
---

## Goal
A sixth pattern for the shop: two light diagonal stripes, the next price step above Halves (50) — a new look to save for between the 40/50 coins items and the 80-coin face accessories.

## Details
A new pattern `src/content/patterns/diagonal.ts`, registered in the patterns index and sold by the shop like the others (closest example: `src/content/patterns/bands.ts`). Name "Diagonal", description "Two light diagonal stripes across the body.", price 60 coins, no prestige requirement. Look: two stripes drawn in the player's own color lightened the same way Bands and the other light patterns are, running diagonally corner to corner across the body, offset from each other, clipped to the body like every pattern, with the outline and face on top. Bold enough to read at 36 units across and on all 10 player colors.

## Acceptance criteria
- [ ] The shop shows "Diagonal" with a mini-critter preview wearing it, priced at 60 coins; buying it spends 60 coins and the player can wear it from the start screen, kept for the next visit.
- [ ] Worn, it reads as two light diagonal stripes on the critter's own color, on any of the 10 colors, with the face easy to see.
- [ ] Bots can wear it at random like the other patterns.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | light stripes across the body | Bands run horizontally across the middle; Diagonal runs corner to corner |
| Spots | painted over the body | five dark dots scattered; two light stripes on the slant |
| Belly | a light patch on the body | one round light patch on the lower body; two long light stripes at a slant |
| Party | light shapes on the body | a zigzag across the top like a paper hat; two straight diagonal stripes |
| Halves | a light area of the body | a flat cut that lights the whole top half; two thin slanted stripes leaving the rest the own color |

## Design (architect, yoga)

### Files
- create `src/content/patterns/diagonal.ts` — the pattern `diagonal` (`PatternDef`), a copy of `src/content/patterns/bands.ts` with a 45° rotation
- edit `src/content/patterns/index.ts` — one import line + one `PATTERNS` line (the shop, preview and bots are all data-driven off `PATTERNS`; no shop or engine changes)

### Interfaces
No new types. `PatternDef` already exists (`engine/api.ts:576`): `{ id, name, description, price, draw(g: CanvasRenderingContext2D, w: WearView) }`.

### Steps
1. Create `src/content/patterns/diagonal.ts`, exactly:

```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const diagonal: PatternDef = {
  id: 'diagonal',
  name: 'Diagonal',
  description: 'Two light diagonal stripes across the body.',
  price: 60,
  draw(g, w) {
    const r = w.radius;
    g.save();
    g.rotate(-Math.PI / 4);
    g.fillStyle = shade(w.color, 0.35);
    g.fillRect(-r, -0.35 * r, r * 2, r * 0.4);
    g.fillRect(-r, 0.42 * r, r * 2, r * 0.4);
    g.restore();
  },
};
```

2. Edit `src/content/patterns/index.ts`: add `import { diagonal } from './diagonal.ts';` after the `halves` import line, and add `diagonal,` as the last element of `PATTERNS` after `halves,` (keeps the shop's price order 30/30/40/40/50/60).

### Pitfalls
- The geometry is Bands rotated: `rotate(-Math.PI / 4)` sends the x' axis up-right ("/"), and the same `-0.35r`/`+0.42r` offsets as `bands.ts` sit perpendicular to the stripes — two parallel light stripes, rim to rim, offset from each other. Stripe fill width `2r` is safe: the engine clips the pattern to the body (`g.clip()` in `drawCritter`, api.ts:824-831) and re-traces the outline after, face drawn on top — no outline/face leak, and `save()/restore()` around the rotation is belt-and-braces (the engine also saves/restores around `def.draw`, api.ts:950-956).
- `shade(w.color, 0.35)` is the exact lightening Bands and the other light patterns use — the stripes are the player's own color lightened, so they read on all 10 player colors; no palette color is named.
- Name is 8 chars and description 42 (tests cap at 18/70); price 60 whole coins, no `prestige` field (none required). Six patterns total, under the 12-pattern cap.
- Do not touch any other pattern file, `base.css`, or the shop: `shop.ts` renders every `price > 0` pattern from `content.patterns` and the engine picks wear for bots at random from the same list.

### Tests
none (engine/tests/ checks every pattern automatically: registration, shop data, draw runs, shop preview).
