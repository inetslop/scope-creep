---
id: T0102
title: "Mustache: a 350-coin face accessory, a curly pink mustache over the mouth"
assignee: desktop
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T17:06:34Z
claimed_at: 2026-10-31T17:31:20Z
finished_at: 2026-10-31T17:35:56Z
epic: E22
---

## Goal
The face slot gets its top item — the top of the thinnest ladder (80, 80, 100, 150, 200): a curly pink mustache, buyable only after a prestige in all, so a veteran face has a long goal past the 200-coin Heart Shades.

## Details
- A new face accessory in the Cosmetics panel: name "Mustache", slot face, price 350, prestige 1 (buyable only after 1 prestige in all, like the Medal's "Needs 2 prestiges in all"), description "A curly pink mustache over the mouth. Needs 1 prestige in all."
- How it looks: two pink curls meeting in the middle below the nose, sitting over the mouth with the mouth still visible beneath; each curl sweeps out to the side and hooks slightly up at the outer end; ink outline; at most a tiny sway with the critter. It reads as one bold horizontal shape at a player's size (36 units across), and it never covers the eyes.
- A new file `src/content/accessories/mustache.ts`, modelled on the closest existing file `src/content/accessories/bow-tie.ts` (a small thing at the mouth), plus one import and one line in `src/content/accessories/index.ts` after the heart-shades line, so the face row reads 80, 80, 100, 150, 200, 350 and stays price-ascending in the shop.
- It changes nothing in play: no stats, no size, no HUD. Buying, wearing, persistence and bot dressing come from the generic accessories iteration.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | a face item | ink frames around the eyes; the Mustache sits at the mouth, pink, no frames |
| Bow Tie | at the mouth | a red bow tied below the mouth; the Mustache sits above the mouth, two hooks, no ribbon |
| Beak | below the eyes | one orange triangle at face centre; the Mustache is two wide pink curls across the mouth |
| Monocle | over one eye | a gold lens over the right eye with a chain to the cheek; the Mustache is symmetric, at the mouth, no lens |
| Heart Shades | around the eyes | two pink heart frames around the eyes; the Mustache is at the mouth, nothing around the eyes |

## Acceptance criteria
- [ ] The Cosmetics panel's face row shows the Mustache last at 350 coins; before the profile has 1 prestige in all it is stamped "Needs 1 prestige in all" and can't be bought, and after it, it buys for 350 coins.
- [ ] Worn, the player's critter in the match shows the pink mustache over the mouth: the mouth stays visible beneath it, the eyes stay clear, and bots can wear it at random.
- [ ] Buying, wearing and taking it off are kept for the next visit, and it changes nothing in play.

## Design (architect, yoga)

### Files
- create `src/content/accessories/mustache.ts` - face accessory `mustache`: name "Mustache", price 350, `prestige: 1`, draw two pink curls over the mouth (candy-cane's double-stroke trick, one continuous path).
- edit `src/content/accessories/index.ts` - one import line after the `heartShades` import, one list line after `heartShades,`.

### Interfaces
None — only an `AccessoryDef` instance, no new types.

### Steps
1. Create `mustache.ts` exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Two pink curls meeting at the centre under the nose, over the mouth, tips hooked up. */
export const mustache: AccessoryDef = {
  id: 'mustache',
  name: 'Mustache',
  description: 'A curly pink mustache over the mouth. Needs 1 prestige in all.',
  slot: 'face',
  price: 350,
  prestige: 1,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.02 * r;
    const ow = Math.max(1.5, r * 0.08);
    const tube = 0.11 * r;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    const path = () => {
      g.beginPath();
      g.moveTo(-0.52 * r, 0.3 * r + sway);
      g.bezierCurveTo(-0.5 * r, 0.44 * r, -0.2 * r, 0.32 * r, 0, 0.3 * r);
      g.bezierCurveTo(0.2 * r, 0.32 * r, 0.5 * r, 0.44 * r, 0.52 * r, 0.3 * r + sway);
    };
    path(); g.lineWidth = tube + 2 * ow; g.strokeStyle = w.ink; g.stroke();
    path(); g.lineWidth = tube; g.strokeStyle = PALETTE.pink; g.stroke();
  },
};
```
2. In `index.ts`, add `import { mustache } from './mustache.ts';` after the `heartShades` import and `mustache,` after `heartShades,` in `ACCESSORIES`. Face row then reads 80, 80, 100, 150, 200, 350.

### Pitfalls
- Geometry is fixed: eye bottom is 0.14r, mouth 0.29r..0.55r; tip tops reach 0.165r (eyes clear) and the tube sags to ~0.36r so the mouth shows beneath. Do not retune the curves.
- One continuous path, stroked ink-then-pink = one outline (candy-cane pattern); don't switch to two paths, that would cross two outlines at the centre.
- Shop, `cantBuy` ("Needs 1 prestige"), persistence and bot dressing are generic over `prestige`/`ACCESSORIES` — do not touch `src/menu/shop.ts` or engine.

### Tests
- none (engine/tests/ covers registration, draw and budget automatically).

## Result (attempt 1, desktop)

Added the Mustache — a 350-coin face accessory buyable only after 1 prestige in all — as `src/content/accessories/mustache.ts`: two pink curls with an ink outline meeting over the mouth, tips hooked up, mouth and eyes left clear, with a tiny sway at speed. Registered it in `src/content/accessories/index.ts` right after heart-shades so the face row stays price-ascending (80, 80, 100, 150, 200, 350). Buying, wearing, persistence, bot dressing and the "Needs 1 prestige in all" gate all come from the generic accessory iteration; nothing in play changed. `npm run check` and `npm run smoke` (desktop + mobile) pass.

- Self-review: APPROVE
- Time: 4.6 min

```
.../game/src/content/accessories/index.ts          |  2 ++
 .../game/src/content/accessories/mustache.ts       | 28 ++++++++++++++++++++++
 2 files changed, 30 insertions(+)
```
