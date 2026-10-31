---
id: T0104
title: "Lollipop: a 500-coin back accessory, a big green lollipop with a white swirl"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T17:29:12Z
claimed_at: 2026-10-31T18:00:02Z
epic: E22
---

## Goal
The top of the back slot and the longest goal in the shop: a look that takes many matches and 2 prestiges in all, so the back ladder ends in a save instead of a dead end.

## Details
- One new back accessory in a new file, registered like the others: name "Lollipop", description "A big green lollipop with a white swirl on the back.", slot back, price 500 coins, prestige 2 (prestiges in all).
- How it looks: behind the body, a short stick (an ink line, about 1.5 body-radii long) rising up the right side of the back, topped by a round green disc about 1.2 body-radii across; the disc face carries a white spiral (2 turns, round-capped, painted like the Lolly pattern's light shade on the green); an ink outline on the disc; a gentle small bob with speed, slower and smaller than the Balloon's.
- It sits clear of the face: the disc's centre is behind the body, about one body-radius above the centre line, so the eyes, the mouth and every head item stay visible; it never covers the eyes.
- Palette candy colors and ink outlines only, no glow. Closest example to copy the shape of: src/content/accessories/candy-cane.ts (a new file src/content/accessories/lollipop.ts plus one import and one registry line in src/content/accessories/index.ts).
- In the shop it reads as the back slot's top: 500 coins, and "Needs 2 prestiges" exactly like the Medal until the profile has 2 prestiges in all.

## Acceptance criteria
- [ ] The Cosmetics panel's back row shows the Lollipop at 500 coins; without 2 prestiges in all it is locked with the same "Needs 2 prestiges" reason the Medal shows, and a player with them can buy it and wear it.
- [ ] A critter wearing it shows a green disc with a white spiral on a stick on its back, readable at a glance in a crowd, never covering the eyes or the face.
- [ ] It changes nothing in play: no size, no stats, no new sound; bots that wear it at random show it on the field.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a small candy item on the back | the pack is a little flat square at the lower back; the Lollipop is a tall stick topped by a round disc that rises above the body |
| Balloon | a round shape bobbing on the back | the balloon is a soft yellow sphere on a string; the Lollipop is a hard green disc on a short stick with a white spiral face |
| Party Blower | a candy on a stick | the blower is a flat red rolled spiral; the Lollipop is a full round disc with a painted spiral, and it bobs while the blower sways |
| Candy Cane | a striped candy on a stick, the other 300+ back goal | the cane is a thin red-and-white hooked rod with no round part; the Lollipop's mass is its green disc |
| Medal | the other back item gated behind 2 prestiges in all | the medal is a flat yellow disc on a red ribbon at chest height; the Lollipop sits higher on the back, is green and white, and costs 500 — the shop's longest goal |

## Design (architect, yoga)

### Files
- create `src/content/accessories/lollipop.ts` — the `lollipop` back accessory (500 coins, prestige 2)
- edit `src/content/accessories/index.ts` — one import line (after line 8, the medal import) and one registry line `lollipop,` after `medal,`
- create `tests/lollipop.test.ts` — pins the shop-top fields, exact mirror of `tests/medal.test.ts`
### Interfaces
No new types: the stock `AccessoryDef` (`id`, `name`, `description`, `slot: 'back'`, `price: 500`, `prestige: 2`, `draw(g, w)` with `w: WearView`).
### Steps
1. Create `src/content/accessories/lollipop.ts` with exactly:
```ts
import { shade, type AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A big green lollipop with a white swirl on a short stick, the back slot's 500-coin top. */
export const lollipop: AccessoryDef = {
  id: 'lollipop',
  name: 'Lollipop',
  description: 'A big green lollipop with a white swirl on the back. Needs 2 prestiges in all.',
  slot: 'back',
  price: 500,
  prestige: 2,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 2.5 + w.seed) * 0.06 * r;
    const ow = Math.max(1.5, r * 0.08);
    const cx = 1.0 * r; // right side of the back
    const cy = -1.0 * r; // disc centre, one radius above the centre line
    g.save();
    g.translate(0, bob);
    // The stick: an ink line up the right side, to the disc's lower edge.
    g.strokeStyle = w.ink;
    g.lineWidth = ow;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx, 0.5 * r);
    g.lineTo(cx, -0.4 * r);
    g.stroke();
    // The disc: green, 1.2 radii across, with its ink outline.
    g.fillStyle = PALETTE.green;
    g.beginPath();
    g.arc(cx, cy, 0.6 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // The swirl: 2 turns, round-capped, the Lolly pattern's light shade on green.
    g.strokeStyle = shade(PALETTE.green, 0.35);
    g.lineWidth = 0.12 * r;
    g.beginPath();
    const max = 2 * Math.PI * 2; // 2 turns
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * max;
      const rad = (th / max) * 0.4 * r;
      const x = cx + Math.cos(th) * rad;
      const y = cy + Math.sin(th) * rad;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  },
};
```
2. `src/content/accessories/index.ts`: add `import { lollipop } from './lollipop.ts';` after line 8 (`import { medal } ...`), and `lollipop,` after `medal,` (line 34) in `ACCESSORIES`.
3. Create `tests/lollipop.test.ts`, copying `tests/medal.test.ts` with: docstring `/** The lollipop: the back slot's top — a 500-coin accessory gated on 2 prestiges in all. */`, `describe('lollipop accessory', ...)` and `it('is a back accessory, 500 coins, gated on 2 prestiges', ...)`, `const lollipop = CONTENT.accessories.find((a) => a.id === 'lollipop');`, `expect(lollipop, 'the lollipop is registered').toBeTruthy();`, `slot`/`price: 500`/`prestige: 2`/`name.length` checks, and `expect(lollipop!.description).toBe('A big green lollipop with a white swirl on the back. Needs 2 prestiges in all.');`.
4. Run `npm run check`, then `npm run smoke`.
### Pitfalls
- Swirl color is `shade(PALETTE.green, 0.35)` — the Lolly pattern's light shade (patterns/lolly.ts:10) applied to green; NOT `PALETTE.white`. It reads white against the green disc.
- The stick ends exactly at the disc's lower edge (`-0.4 * r` = `cy + 0.6r`) so the ink line never runs into the disc interior.
- The whole group (stick + disc + swirl) shares the one `g.translate(0, bob)`; amplitude 0.06r and frequency 2.5 are both under the Balloon's 0.15r/6 (balloon.ts:12).
- Geometry is fixed by the code: disc centre `(1.0r, -1.0r)` radius `0.6r` — above the eyes (≈y −0.1r), never covering the face; head items are drawn after the back slot so they stay visible on top; nothing drawn past 2 radii of centre (top point 1.89r + 0.06r bob).
- The task's detail line gives only the blurb; the Medal appends the lock sentence to its description and the Cosmetics detail line shows it (shop.ts:89) — keep the full string exactly as in step 1/3 so it reads like the Medal. The "Needs 2 prestiges" buy-button text comes from the engine automatically off `prestige: 2`; do not edit any `src/menu/` file.
- Keep the `index.ts` diff to exactly two lines — T0101/T0102 add their own lines to the same file.
### Tests
`tests/lollipop.test.ts` (step 3, mirror of `tests/medal.test.ts`). No other tests: no pure helpers are added.
