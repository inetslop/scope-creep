---
id: T0128
title: "Pinwheel: a 240-coin back accessory, a pink and white pinwheel that turns on a stick"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T21:28:31Z
claimed_at: 2026-10-31T21:59:44Z
finished_at: 2026-10-31T22:09:26Z
epic: E26
---

## Goal
The back slot's missing 180→300 step: a 240-coin pinwheel, so every slot reaches 7 items and the shop's price ladders have no gap past 150 coins.

## Details
- A new back accessory "Pinwheel", 240 coins, no prestige lock: a new file `src/content/accessories/pinwheel.ts` (model it on `party-blower.ts` for the stick and `lollipop.ts` for a round head on a stick), registered in `src/content/accessories/index.ts` in price order between Party Blower (180) and Candy Cane (300).
- Look: a thin ink stick up off the back, and at its top a small pinwheel head about 0.9 of the body radius across: four triangular blades, two pink and two white (candy palette colors, ink outlines) around a small yellow center. It sits clear of the eyes and below the player's name.
- Motion: the blades turn at a constant slow spin, one full turn every 4 s, computed from the draw hook's `time` alone (the blade angle turns with time). No dependence on the critter's speed and no accumulated rotation: the hook is stateless and a speed-dependent spin was rejected for this accessory (T0122). The stick may keep the Party Blower's small instantaneous-speed sway, and nothing more.
- It changes nothing in play: no stats, no size. Bots may wear it at random like the other back items.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a small item on the back | a flat green pack; the Pinwheel is a round blade head that turns on a stick |
| Balloon | a round item on the back that moves | a bobbing sphere on a string above the back; the Pinwheel is a four-blade fan that rotates on a stick |
| Party Blower | a thin stick up off the back | a rolled red horn at rest on the stick; the Pinwheel carries a turning pink-and-white blade head |
| Candy Cane | a long curved item over the back | a red-and-white J-shaped cane; the Pinwheel is a small round head of four blades |
| Medal | a round yellow disc on the back | a still disc on a red ribbon; the Pinwheel's disc is a four-blade fan on a stick, in pink and white, and it turns |
| Lollipop | a round candy head on a short stick | a big still green swirl; the Pinwheel is smaller, four flat pink and white blades, and it turns |

## Acceptance criteria
- [ ] The Cosmetics panel lists Pinwheel in the back row at 240 coins; buying, previewing, wearing and taking it off work like the other back items, and what is worn is kept for the next visit.
- [ ] On a critter in the match the pinwheel reads at a glance: a stick off the back with four alternating pink and white triangular blades around a yellow center, ink outlines, no glow, clear of the eyes.
- [ ] The blades complete one full turn every 4 s whether the critter stands still or sprints (the spin does not change with speed).
- [ ] The back slot has 7 items and no price ladder between 80 and 400 coins has a gap bigger than 150 (back: 100, 120, 180, 240, 300, 400, 500).

## Design (architect, desktop)

### Files
- create `src/content/accessories/pinwheel.ts` — the Pinwheel back accessory (id `pinwheel`, price 240, no `prestige`), modeled on `src/content/accessories/party-blower.ts` (stick + sway) with a round head like `lollipop.ts`
- edit `src/content/accessories/index.ts` — one import line + one registry line (price order: 180 → 240 → 300)

### Interfaces
No new types. Uses existing `AccessoryDef` (`id, name, description, slot: 'back', price: number, draw(g, w)`) and `WearView` (`radius, ink, time, seed, speed`). The shop panel (`src/menu/shop.ts:169`) lists `view.accessories` filtered by slot in registry order — no menu or bot changes needed; a registry line is all it takes for buying, preview, wearing and persistence.

### Steps
1. Create `src/content/accessories/pinwheel.ts` with exactly this content:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small pinwheel on a stick: four blades that turn, two pink and two white. */
export const pinwheel: AccessoryDef = {
  id: 'pinwheel',
  name: 'Pinwheel',
  description: 'A pink and white pinwheel that turns on a stick, on the back.',
  slot: 'back',
  price: 240,
  draw(g, w) {
    const r = w.radius;
    // The Party Blower's small speed sway, on the head only (the spin itself never uses speed).
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.08 * r;
    const cx = 1.1 * r + sway; // head centre, right of the back
    const cy = 0.25 * r;
    // The stick: a thin ink line up off the back, to the head's lower edge.
    g.strokeStyle = w.ink;
    g.lineCap = 'round';
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.beginPath();
    g.moveTo(0.5 * r, 1.25 * r);
    g.lineTo(cx, cy + 0.35 * r);
    g.stroke();
    // The blades: four triangles, one full turn every 4 s, computed from time alone.
    const spin = (w.time / 4) * Math.PI * 2;
    g.lineWidth = Math.max(1, r * 0.06);
    for (let i = 0; i < 4; i++) {
      const th = spin + (i * Math.PI) / 2;
      g.fillStyle = i % 2 === 0 ? PALETTE.pink : PALETTE.white;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(th) * 0.45 * r, cy + Math.sin(th) * 0.45 * r); // tip
      g.lineTo(cx + Math.cos(th + 0.9) * 0.22 * r, cy + Math.sin(th + 0.9) * 0.22 * r); // swept base
      g.closePath();
      g.fill();
      g.stroke();
    }
    // The small yellow hub over where the blades meet.
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(cx, cy, 0.12 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  },
};
```

2. In `src/content/accessories/index.ts`, add `import { pinwheel } from './pinwheel.ts';` after the `partyBlower` import (line 21), and add `pinwheel,` to the `ACCESSORIES` array between `partyBlower,` (line 41) and `candyCane,` (line 42).

### Pitfalls
- Do not add `w.seed` or `w.speed` to `spin` — the acceptance test is one turn per 4 s regardless of speed; the hook stays a pure function of `w` (no state, no `Math.random`).
- Blade tip radius is `0.45 * r` (head ≈ 0.9 r across); head centre at `(1.1r, 0.25r)` keeps the head within two radii of centre, clear of the eyes (which sit near the middle, `|x| < 0.5r`) and below the name.
- The `th + 0.9` swept base leaves a 0.67 rad gap between neighbouring blades — keep that offset; smaller values make blades overlap and cross outlines.
- Colors only from `PALETTE` (`pink`, `white`, `yellow`, `w.ink`); no glow, no `shade()` on the blades.

### Tests
- none (accessories are tested automatically by `engine/tests/`: file named after its id, registered, draw hook runs).

## Result (attempt 1, yoga)

Added the Pinwheel back accessory — a 240-coin, no-prestige-lock item in `src/content/accessories/pinwheel.ts`: an ink stick up off the back with a round head of four triangular blades (two pink, two white) around a small yellow hub, blades ink-outlined, clear of the eyes, keeping the Party Blower's small speed sway. The blades complete one full turn every 4 s computed from the draw hook's `time` alone (no speed dependence, no accumulated state). Registered it in `src/content/accessories/index.ts` between Party Blower (180) and Candy Cane (300), which the shop panel picks up for buying, preview, wearing and persistence — the back slot now has 7 items with no price gap past 150 coins. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 9.7 min

```
.../game/src/content/accessories/index.ts          |  2 +
 .../game/src/content/accessories/pinwheel.ts       | 46 ++++++++++++++++++++++
 2 files changed, 48 insertions(+)
```
