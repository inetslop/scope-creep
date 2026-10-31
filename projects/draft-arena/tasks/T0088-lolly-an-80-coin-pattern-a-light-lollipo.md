---
id: T0088
title: "Lolly: an 80-coin pattern, a light lollipop swirl across the body"
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T15:05:01Z
claimed_at: 2026-10-31T15:58:46Z
epic: E21
---

## Goal
The pattern shelf stops at 60 coins (Diagonal) and the price ladder has a next step to take: an 80-coin pattern that is a swirl, not another stripe, dot or patch.

## Details
- A new pattern `lolly` in src/content/patterns/ (the closest existing example is `diagonal.ts`), registered in the patterns index exactly like the others.
- Name "Lolly", price 80 coins, no prestige requirement.
- Description: "A light lollipop swirl across the body."
- How it looks: one light spiral, a lollipop swirl — it starts at the body's centre and winds out toward the edge in about one and a half turns, drawn as a single light stroke (lighter than the player's own color, the same light shade the other light patterns use), clipped to the body like every pattern. Bold enough to read at a player's 36 units across; the outline and the face go on top and stay easy to see.
- It works on all 10 player colors the same way the light patterns do (Bands, Belly, Party, Halves, Diagonal).

## Compared with what exists
| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | both are light shapes across the body | the bands are two straight parallel cuts; Lolly is one connected line that turns |
| Spots | both are light or dark marks on the body | the spots are five separate dots; Lolly is a single continuous line that winds |
| Belly | both use a light patch of color | the belly is a solid round fill on the lower body; Lolly is a line, not a fill, and it is centred |
| Party | both are light across the top of the body | the party zigzag sits on the top edge like a hat; Lolly winds through the middle of the body |
| Halves | both paint light over the body | halves lighten a whole half of the body; Lolly is a single swirl line, not a fill at all |
| Diagonal | both are two-part light patterns | diagonal is two straight parallel stripes; Lolly is one curving line that turns around the centre |

## Acceptance criteria
- [ ] The Cosmetics panel shows Lolly at 80 coins, with the preview critter wearing it on the player's own color.
- [ ] Wearing Lolly paints one light lollipop-swirl spiral across the body that reads on any of the 10 player colors, with the outline and face on top and easy to see.
- [ ] Buying it spends 80 coins, it is kept for the next visit, and bots wear it at random like the other patterns.
- [ ] The pattern shelf's price ladder now reads 30, 30, 40, 40, 50, 60, 80.

## Design (architect, yoga)

### Files
- create `src/content/patterns/lolly.ts` - the `lolly` PatternDef, export `lolly`
- edit `src/content/patterns/index.ts` - add `import { lolly } from './lolly.ts';` after the `diagonal` import, and one line `lolly,` after `diagonal,` in `PATTERNS` (this keeps the shelf's price order 30, 30, 40, 40, 50, 60, 80 — the shop lists `view.patterns` in registry order)

### Interfaces
No new types. `PatternDef` fields for the item:
```ts
export const lolly: PatternDef = {
  id: 'lolly',
  name: 'Lolly',
  description: 'A light lollipop swirl across the body.',
  price: 80,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = shade(w.color, 0.35);
    g.lineWidth = 0.18 * r;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    const max = 1.5 * Math.PI * 2; // 1 and a half turns
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * max;
      const rad = (th / max) * r;
      const x = Math.cos(th) * rad;
      const y = Math.sin(th) * rad;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  },
};
```

### Steps
1. Create `src/content/patterns/lolly.ts` exactly as above (copy the import line from `diagonal.ts`: `import { shade, type PatternDef } from '../../../engine/api.ts';`).
2. Edit `src/content/patterns/index.ts`: add the import line and the `lolly,` registry line, each after the `diagonal` line. Nothing else.

### Pitfalls
- It is a stroke, not a fill: end with `g.stroke()`, never `g.fill()` — a filled spiral reads as a blob (the Belly problem).
- Use `0.35` exactly (the same light shade as Bands, Belly, Party, Halves, Diagonal); `shade` already returns a valid color for all 10 player colors. No `Math.random` and no `w.seed` (no existing pattern varies per player; keep it deterministic).
- Do not touch `w.ink`/the face: the engine draws the outline and face on top of the pattern (see `PatternDef` comment), so the inner turn passing under the face is correct and stays readable.
- No `g.save()/g.restore()` needed (no transforms), and none may be left unbalanced.
- No other files: the Cosmetics panel, preview, buying (80 coins) and bots wearing it at random all flow from the registry automatically.

### Tests
none (content is tested automatically by `engine/tests/`: name 1-18 chars, description ≤ 70 chars, whole price ≥ 0, `draw()` must not throw — it won't).
