---
id: T0065
title: "Heart Shades: a 200-coin face accessory, pink heart frames around the eyes"
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T12:00:08Z
---

## Goal
The shop's face shelf (its thinnest: 3 items) gets its mid-tier item: a 200-coin pair of pink heart frames, a saving goal between the 100-coin Beak and the 300-coin Chef Hat.

## Details
A new file in src/content/accessories/ (closest example: src/content/accessories/round-glasses.ts, the other face item drawn at the eyes), registered in the accessories index:
- name: "Heart Shades", description: "Pink heart frames around the eyes.", slot: face, price: 200, no prestige.
- Look: two pink hearts with ink outlines as frames around the eyes — outline only, the eyes stay visible through them, with a short ink bridge between the two at the nose. A little bounce with the critter's bob, nothing more. It sits at the eyes, where Round Glasses sits, and never covers them.
- The shop, the start screen and the bot wearing pick it up from the registry with no other edits; it changes nothing in play.

## Compared with what exists (face accessories)
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | frames around the eyes | thin round ink frames, one plain circle each; Heart Shades is two chunky pink hearts, colored and shaped |
| Bow Tie | a face item in one candy color | a red bow at the mouth, below the eyes; Heart Shades sits at the eyes and reads as two hearts from across the field |
| Beak | a small solid item below the eyes | one solid orange triangle at the mouth line; Heart Shades is two outlined pink hearts around the eyes |

## Acceptance criteria
- [ ] The shop's face row shows a mini-critter wearing the pink heart frames, priced 200; buying it spends 200 coins and the critter still wears them on the next visit.
- [ ] In a match, a critter wearing them shows two pink heart outlines around the eyes, eyes and mouth still visible, readable at a player's size in a crowd.
- [ ] Bots sometimes wear them in a match.
- [ ] No new start-screen card: the shop the coin line already opens lists it.

## Design (architect, yoga)

### Files
- create `src/content/accessories/heart-shades.ts` - the accessory `id: 'heart-shades'` (export `heartShades`), a pink heart-frame face item, price 200
- edit `src/content/accessories/index.ts` - add the import (after the `beak` import) and one line `heartShades,` after `beak,` in `ACCESSORIES` (keeps the face items together)

### Interfaces
No new types. `AccessoryDef` (`engine/api.ts`): `id`, `name` (≤18 chars), `description`, `slot: 'face'`, `price: 200`, `draw(g: CanvasRenderingContext2D, w: WearView) => void`. No `prestige`.

### Steps
1. Create `src/content/accessories/heart-shades.ts` with exactly this content (model: `round-glasses.ts`):

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

function heart(g: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  g.beginPath();
  g.moveTo(cx, cy + 0.75 * s);
  g.bezierCurveTo(cx - 1.5 * s, cy - 0.75 * s, cx - s, cy - 1.25 * s, cx - 0.5 * s, cy - 0.25 * s);
  g.bezierCurveTo(cx + s, cy - 1.25 * s, cx + 1.5 * s, cy - 0.75 * s, cx, cy + 0.75 * s);
}

export const heartShades: AccessoryDef = {
  id: 'heart-shades',
  name: 'Heart Shades',
  description: 'Pink heart frames around the eyes.',
  slot: 'face',
  price: 200,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.1 * r;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const side of [-1, 1] as const) {
      const cx = side * 0.38 * r;
      const cy = -0.12 * r + bob;
      heart(g, cx, cy, 0.28 * r);
      g.strokeStyle = w.ink;
      g.lineWidth = Math.max(3, r * 0.15);
      g.stroke();
      g.strokeStyle = PALETTE.pink;
      g.lineWidth = Math.max(1.5, r * 0.07);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(-0.14 * r, -0.17 * r + bob);
    g.lineTo(0.14 * r, -0.17 * r + bob);
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(1.5, r * 0.06);
    g.stroke();
  },
};
```

2. Edit `src/content/accessories/index.ts`: add `import { heartShades } from './heart-shades.ts';` after the `beak` import, and `heartShades,` after `beak,` in the list.

### Pitfalls
- Never fill the hearts (`g.fill()`) — they are outline-only so the eyes stay visible through them; "never covers" is an acceptance criterion.
- Keep the exact bezier numbers: the two `bezierCurveTo`s per half-heart must be mirrored (`cx - 1.5*s, cx - s` vs `cx + s, cx + 1.5*s`) or the hearts are lopsided.
- Stay within two radii of centre (outer edge ≈ 0.72r) — ok.
- Animation only from `w.time`/`w.speed`/`w.seed` (like `balloon.ts`); no `Math.random`, `Date`, `performance`.
- The shop, preview, bot-wearing and "wears on next visit" all come from the `ACCESSORIES` registry via the content bundle — no other file is touched (acceptance: no new start-screen card).
- Face slot is at 4/10 after this; name is 12/18 chars; `PALETTE.pink` exists.

### Tests
none (engine/tests/ checks the file/registry/draw automatically).
