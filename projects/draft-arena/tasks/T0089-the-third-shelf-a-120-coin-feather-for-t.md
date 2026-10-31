---
id: T0089
title: "The third shelf: a 120-coin Feather for the head, a 300-coin Candy Cane for the back"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T15:05:01Z
claimed_at: 2026-10-31T16:38:49Z
finished_at: 2026-10-31T16:50:46Z
epic: E21
---

## Goal
After the free hats the head slot is quiet until the 150-coin Bloom and the 300-coin Chef Hat, and the back jumps from the 180-coin Party Blower straight to the 400-coin Medal. Two middle steps give both slots a next save to work toward, in the shop's price ladder.

## Details
Two new accessories in src/content/accessories/ (closest existing examples: `bloom.ts` for the head item, `party-blower.ts` for the back item), each registered in the accessories index exactly like the others. Both change nothing in play.

1. **Feather** (`feather`), slot head, 120 coins, no prestige. Description: "A single pink feather resting on the head." One pink feather leaf, tilted about 30 degrees, resting on the top of the head: a rounded leaf shape with a small ink quill line down its middle, ink outline, a little bounce with movement. It never covers the eyes and reaches at most one radius above the head, where the player's name sits.
2. **Candy Cane** (`candy-cane`), slot back, 300 coins, no prestige. Description: "A red and white striped cane hooked over the back." A candy cane resting over the back: a curved cane with the hook up over one shoulder, alternating red and white stripes, ink outline, a small sway with movement.

The prices sit in the ladders: the head slot then reads free, free, 120, 150, 300, and the back slot reads 100, 120, 180, 300, 400.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Chef Hat | both sit on the head | the chef hat is a tall white puff that fills the top of the head; the feather is one thin tilted pink leaf to the side, the head still showing |
| Cone | both are headwear | the cone is a solid yellow triangle with a red tip; the feather is a soft pink leaf, open and tilted, not a cone |
| Beanie | both cover the top of the head | the beanie is a purple dome with a pink pom over the whole head; the feather is a single leaf resting on top, not a dome |
| Bloom | both are on the head | the bloom is a five-petal pink flower with a yellow centre; the feather is one leaf with a quill line — no petals, no centre |
| Candy Pack | both sit on the back | the pack is a small green square; the cane is a long curved striped hook, not a box |
| Medal | both hang on the back | the medal is a yellow disc with a red ribbon; the cane is striped red and white, curved with a hook, and leans over the shoulder |
| Balloon | both bob on the back | the balloon is a round yellow balloon on a string; the cane is striped and rigid with a hook, no string |
| Party Blower | both are red party things on the back | the blower is a red roll on a stick; the cane is one continuous curved hook with red and white stripes, no stick |

## Acceptance criteria
- [ ] The Cosmetics panel shows the Feather at 120 coins (head) and the Candy Cane at 300 coins (back), with the preview critter wearing each when pointed at.
- [ ] A Feather-wearing player shows the tilted pink feather on the head in a crowd with the eyes clear; a Candy Cane-wearing player shows the striped cane hooked over the back.
- [ ] Both can be bought, worn and taken off like the other accessories, are kept for the next visit, and bots wear them at random.
- [ ] The shop's head ladder reads 0, 0, 120, 150, 300 and the back ladder reads 100, 120, 180, 300, 400.

## Design (architect, desktop)

### Files
- create `src/content/accessories/feather.ts` - the Feather accessory (head, 120 coins)
- create `src/content/accessories/candy-cane.ts` - the Candy Cane accessory (back, 300 coins)
- edit `src/content/accessories/index.ts` - add 2 imports and 2 lines; reorder the head and back lines so each slot's prices read ascending in the shop (the shop, `src/menu/shop.ts`, lists swatches in registry order and does not sort)

### Interfaces
No new types. Both files export an `AccessoryDef` (from `engine/api.ts`): fields `id`, `name` (≤18 chars), `description`, `slot`, `price`, `draw(g, w)` with `w: WearView` (`w.radius`, `w.ink`, `w.time` seconds, `w.seed`, `w.speed`). No other file changes: the shop panel, profile store, buying/wearing and bot dressing all iterate `ACCESSORIES` generically.

### Steps
1. Create `feather.ts` exactly as below. Base sits at `(-0.1r, -0.95r)` on the head, tilted 30° with `rotate(0.52)` so the tip points up-right; tip reaches at most ≈`-1.91r` (under the name, which the engine moves to `-2r` when a head item is worn) and the lowest point stays ≈`-0.89r`, clear of the eyes:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A single pink feather, tilted about 30 degrees, resting on the top of the head. */
export const feather: AccessoryDef = {
  id: 'feather',
  name: 'Feather',
  description: 'A single pink feather resting on the head.',
  slot: 'head',
  price: 120,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.05 * r;
    g.lineJoin = 'round';
    g.save();
    g.translate(-0.1 * r, (-0.95 + bob / r) * r);
    g.rotate(0.52); // tilted about 30 degrees, tip up and to the right
    const L = 1.05 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    g.fillStyle = PALETTE.pink;
    // The leaf: base at (0,0), tip up at (0,-L), a soft rounded leaf.
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(0.42 * L, -0.32 * L, 0, -L);
    g.quadraticCurveTo(-0.42 * L, -0.32 * L, 0, 0);
    g.fill();
    g.stroke();
    // The quill line down its middle.
    g.lineWidth = Math.max(1, r * 0.05);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -0.82 * L);
    g.stroke();
    g.restore();
  },
};
```

2. Create `candy-cane.ts` exactly as below. The cane is one stroked path drawn three times (wide ink, white tube, dashed red = stripes). Base at `(0.55r, 1.35r)` behind the lower body, straight up, hook = half circle of radius `0.3r` whose top clears the body top (`≈-1.4r`, over the shoulder), tip dangling at `(-0.05r, -1.1r)`:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A red and white striped cane, hooked over the back, the hook up over one shoulder. */
export const candyCane: AccessoryDef = {
  id: 'candy-cane',
  name: 'Candy Cane',
  description: 'A red and white striped cane hooked over the back.',
  slot: 'back',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 4 + w.seed * 3) * 0.045;
    const ow = Math.max(1.5, r * 0.08);
    const tube = 0.3 * r;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.save();
    g.translate(0.55 * r, 1.35 * r);
    g.rotate(sway);
    // The cane: straight up from the back, then a hook over the shoulder.
    const path = () => {
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -2.45 * r);
      g.arc(-0.3 * r, -2.45 * r, 0.3 * r, 0, -Math.PI, true);
    };
    // Ink outline, then white, then the red stripes on top.
    path();
    g.lineWidth = tube + 2 * ow;
    g.strokeStyle = w.ink;
    g.stroke();
    path();
    g.lineWidth = tube;
    g.strokeStyle = PALETTE.white;
    g.stroke();
    path();
    g.setLineDash([0.3 * r, 0.3 * r]);
    g.strokeStyle = PALETTE.red;
    g.stroke();
    g.setLineDash([]);
    g.restore();
  },
};
```

3. Edit `src/content/accessories/index.ts`: keep the existing 12 import lines, add `import { candyCane } from './candy-cane.ts';` after the candyPack import and `import { feather } from './feather.ts';` after the bloom import. Replace the `ACCESSORIES` list with exactly (head slot now reads 0, 0, 120, 150, 300 and back 100, 120, 180, 300, 400; the `chefHat` and `medal` lines move, everything else keeps its line):

```ts
export const ACCESSORIES: readonly AccessoryDef[] = [
  candyPack,
  cone,
  beanie,
  feather,
  bloom,
  chefHat,
  roundGlasses,
  bowTie,
  beak,
  heartShades,
  balloon,
  partyBlower,
  candyCane,
  medal,
];
```

4. Run `npm run check` (engine/tests auto-validate both defs, the file/registry match and the draw calls).

### Pitfalls
- Always `g.save()`/`g.restore()` around the translate/rotate, and `g.setLineDash([])` after the red pass — a leaked transform or dash breaks the next critter's draw and the smoke test.
- No `Math.random`, `Date` or `performance` in `src/content/` (lint): animation from `w.time`, variation from `w.seed` only, as in the snippets.
- Colors only from `PALETTE` plus `w.ink`; no glow/gradient, one outline per shape (the quill line and the dashed stripes are single interior strokes, same pattern as the party blower's roll line).
- Do not call `drawCritter()` — accessory `draw` adds on top of the body, around the centre (see `bloom.ts`).
- Keep all points within two radii of the centre (name sits at `-2r` when a head item is worn): the snippets' max reach is ≈1.91r (feather tip with bob) and ≈1.45r (cane base).
- Do not touch `shop.ts`, `base.css` or any other accessory's file.

### Tests
none — no pure helpers; `engine/tests/` covers both accessories (data, one-item-per-file, registration, `draw()` runs) and the 60-player budget automatically.

## Result (attempt 1, cachyos-x8664)

Added two accessories to the shop's price ladders: a 120-coin pink Feather for the head (a single tilted pink leaf with a quill line, resting on top of the head, clear of the eyes) and a 300-coin striped Candy Cane for the back (a curved red-and-white cane hooked over the shoulder). Both are in `src/content/accessories/` and registered in `index.ts`, which I reordered so each slot's prices read ascending in the shop (head: 0, 0, 120, 150, 300; back: 100, 120, 180, 300, 400). Both `npm run check` and `npm run smoke` pass; buying, wearing, persistence and bot dressing come for free via the generic `ACCESSORIES` iteration. One deviation from the design doc: its target list for `index.ts` omitted `monocle`, which exists in the folder and was already registered — I kept that line (in place, between `beak` and `heartShades`) since every file must stay registered.

- Self-review: APPROVE
- Time: 12.0 min

```
.../game/src/content/accessories/candy-cane.ts     | 44 ++++++++++++++++++++++
 .../game/src/content/accessories/feather.ts        | 37 ++++++++++++++++++
 .../game/src/content/accessories/index.ts          |  8 +++-
 3 files changed, 87 insertions(+), 2 deletions(-)
```
