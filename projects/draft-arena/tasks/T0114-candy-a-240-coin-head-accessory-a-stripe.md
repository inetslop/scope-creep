---
id: T0114
title: "Candy: a 240-coin head accessory, a striped candy on the side of the head"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T19:06:11Z
claimed_at: 2026-10-31T19:20:47Z
epic: E26
---

## Goal
The head shelf's missing middle step between the 150-coin Bloom and the 300-coin Chef Hat: a candy with its own silhouette that reads on a critter in a crowd.

## Details
- New head accessory **Candy** (`src/content/accessories/candy.ts`), slot head, 240 coins, no prestige.
- Description (one line, under 70 characters): "A striped orange and white candy on the side of the head."
- Look: a horizontal ellipse (about 0.7 radii wide, 0.45 radii tall) resting on the side of the head at ear height, ink outlined; an orange body with three white vertical stripes; two small white wrapper twists (little triangle fans) at its left end; a small white shine; a gentle bob (about 0.05 radii over 3 s — slower and smaller than the Balloon's). It never covers the eyes and stays below the top of the head, clear of the player's name.
- Model it on `src/content/accessories/bloom.ts` (a head item drawn in palette colors with ink outlines and a light bob); register it in `src/content/accessories/index.ts` with one import and one registry line between Bloom (150) and Chef Hat (300), keeping the shelf's price order.
- Price: 240 coins — the step between Bloom (150) and the Chef Hat (300); the head ladder reads 120, 150, 240, 300, 450.
- Add `tests/candy.test.ts` mirroring `tests/lollipop.test.ts`: head slot, 240 coins, no prestige lock.

## Compared with what exists

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Cone | sits on the head | a wide striped ellipse with wrapper twists on the side, not a tall cone on top |
| Beanie | sits on the head | a hard striped candy ellipse, not a soft dome with a pom |
| Feather | a small item resting on the head | a wide ellipse with two twists, not a single leaf |
| Bloom | a round item on the head | a striped ellipse with wrapper twists, not a flower of petals |
| Chef Hat | sits on the head | a low, wide candy on the side, not a tall puff on top |
| Cherry | a small candy on the head | a striped ellipse with wrapper twists on the side, not a round ball with a stem |

## Acceptance criteria
- [ ] The Cosmetics panel lists Candy at 240 coins with no prestige lock; buying and wearing works and is kept for the next visit.
- [ ] Worn, it shows the striped orange-and-white ellipse with its two white wrapper twists on the side of the head, ink outlined, bobbing gently; the eyes stay clear and nothing rises above the top of the head.
- [ ] The preview critter wears it in the panel, and bots that own it show it in the match.
- [ ] Nothing in play changes: no stat, no size, no hitbox difference for a critter wearing it.

## Design (architect, yoga)

### Files
- create `src/content/accessories/candy.ts` - the Candy `AccessoryDef`
- edit `src/content/accessories/index.ts` - one import line + one registry line, both between `bloom` and `chefHat`
- create `tests/candy.test.ts` - mirrors `tests/lollipop.test.ts`

### Interfaces
None new; `candy: AccessoryDef` with `draw(g: CanvasRenderingContext2D, w: WearView): void`.

### Steps
1. `src/content/accessories/candy.ts` — exactly:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A striped orange and white candy on the side of the head, with two white wrapper twists. */
export const candy: AccessoryDef = {
  id: 'candy',
  name: 'Candy',
  description: 'A striped orange and white candy on the side of the head.',
  slot: 'head',
  price: 240,
  draw(g, w) {
    const r = w.radius;
    const by = Math.sin(w.time * 2 + w.seed * 6.283) * 0.05 * r;
    const cx = 0.92 * r;
    const cy = -0.35 * r + by;
    const ex = cx - 0.35 * r; // the left end of the body
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.lineWidth = 0.12 * r;
    // The two white wrapper twists at the left end, behind the body: fill then ink stroke.
    for (const m of [-1, 1]) {
      g.beginPath();
      g.moveTo(ex - 0.18 * r, cy + 0.06 * r * m);
      g.lineTo(ex, cy + 0.12 * r * m);
      g.lineTo(ex, cy);
      g.closePath();
      g.fillStyle = PALETTE.white;
      g.fill();
      g.strokeStyle = w.ink;
      g.stroke();
    }
    // The orange body with its ink outline, over the twists' bases: one shared outline.
    g.beginPath();
    g.ellipse(cx, cy, 0.35 * r, 0.225 * r, 0, 0, Math.PI * 2);
    g.fillStyle = PALETTE.orange;
    g.fill();
    g.stroke();
    // The three white vertical stripes, clipped to the body.
    g.save();
    g.clip();
    for (const dx of [-0.16, 0, 0.16]) {
      g.beginPath();
      g.rect(cx + (dx - 0.05) * r, cy - 0.225 * r, 0.1 * r, 0.45 * r);
      g.fillStyle = PALETTE.white;
      g.fill();
    }
    g.restore();
    // One small white shine, in the orange gap left of the first stripe.
    g.beginPath();
    g.arc(cx - 0.24 * r, cy - 0.1 * r, 0.05 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
```

2. `src/content/accessories/index.ts` — add `import { candy } from './candy.ts';` on the line after the `bloom` import, and `candy,` in `ACCESSORIES` on the line after `bloom,` (before `chefHat,`), keeping the shelf's price order 150 → 240 → 300.
3. `tests/candy.test.ts` — copy `tests/lollipop.test.ts`, change: comment "the head shelf's middle step"; describe `'candy accessory'`; find id `'candy'`; message `'the candy is registered'`; `slot` `'head'`; `price` `240`; `expect(candy!.prestige).toBeUndefined();`; keep the name-length and exact-description assertions with the description string from step 1.

### Pitfalls
- Draw order is the trick: twists first, then the body fill+stroke — the body covers the twists' base strokes so the visible ink is one shared outline (no crossing lines); never stroke the twists after the body.
- `g.clip()` uses the current path, so it must follow the ellipse `beginPath` (which it does, straight after `fill`/`stroke`).
- The shine sits between the body's left edge and stripe 1; if moved onto a stripe it is white-on-white and invisible.
- Keep the description byte-identical to the test's.
- All geometry ≤ 1.27 r from centre (within the two-radii limit), top at −0.575 r + 0.05 r bob: never above the head, clear of the eyes (x ≥ 0.39 r).

### Tests
- `tests/candy.test.ts` as above; the engine tests cover registration, one-item-per-file and the draw automatically.
