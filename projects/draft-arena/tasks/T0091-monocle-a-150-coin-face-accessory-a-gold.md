---
id: T0091
title: "Monocle: a 150-coin face accessory, a gold lens over one eye"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T15:16:30Z
epic: E21
---

## Goal
The face slot — the shop's thinnest shelf — gets its middle step: one gold lens over one eye with a chain to the cheek, so a player with a few lives has a next save between the 100-coin Beak and the 200-coin Heart Shades.

## Details
- A new accessory "Monocle" in src/content/accessories/ (closest examples: round-glasses.ts — a frame around the eyes; heart-shades.ts — a colored frame). One new file plus one registry line in the accessories index.
- slot: face, price 150, no prestige. description: "A gold lens over one eye, with a thin chain to the cheek."
- How it looks: a yellow ring (the palette yellow, used as it is) around the critter's right eye, the same ring weight as the Round Glasses frames, with an ink outline; the center of the ring is clear, so the eye stays visible; a thin ink chain runs from the lens rim down the cheek and ends in a small ink dot; the chain sways a little with the critter's movement (at most a little bounce).
- It never covers the eye, never reaches beyond the face, and changes nothing in play: no stats, no size.
- Price: 150 coins — the face slot's step between the 100-coin Beak and the 200-coin Heart Shades, priced against what a match earns like the other middle items.

## Acceptance criteria
- [ ] The Cosmetics panel sells a "Monocle" face item at 150 coins, listed between the Beak (100) and the Heart Shades (200); a player can buy it, wear it, take it off, and it is still worn on the next visit.
- [ ] A critter wearing it shows one yellow ring around one eye (clear center, the eye visible) and a thin ink chain to the cheek; it reads at a glance on a critter in a crowd.
- [ ] The shop's preview critter wears it when it is pointed at, like the other face items.
- [ ] It changes nothing in play: the wearer's stats and size are unchanged, and the eye and the name above the head stay visible.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | frames around the eyes | the glasses are two ink rings around both eyes; the Monocle is one yellow ring around one eye only, with a chain that hangs to the cheek |
| Heart Shades | frames around the eyes | the shades are two pink hearts over both eyes; the Monocle is one round yellow lens over one eye, with no second lens and no heart shape |
| Beak | sits on the face, below the eyes | the beak is a solid orange triangle below the eyes; the Monocle is a clear ring around one eye — a circle, not a triangle, over the eye, not below it |
| Bow Tie | sits at the mouth | the bow is two red triangles at the mouth; the Monocle is up at one eye, a ring with a hanging chain, not a bow at the mouth |

## Design (architect, yoga)

### Files
- create `src/content/accessories/monocle.ts` — the `monocle: AccessoryDef` (id `monocle`), face slot, price 150, no `prestige`.
- edit `src/content/accessories/index.ts` — one import (`import { monocle } from './monocle.ts';` after the `beak` import) and one registry line: `monocle,` placed between the existing `beak,` and `heartShades,` lines (the shop lists items in array order — no price sort in `src/menu/shop.ts:165-168` — so this puts it between Beak and Heart Shades; no other file changes, the Cosmetics panel and preview are data-driven).

### Interfaces
No new types. Reuse `AccessoryDef` (`engine/api.ts:558`): `id, name, description, slot: 'face', price: 150, draw(g, w)`.

### Steps
1. Copy `src/content/monsters/`… no — copy `src/content/accessories/round-glasses.ts` as `monocle.ts`, export `monocle`, set: `id: 'monocle'`, `name: 'Monocle'`, `description: 'A gold lens over one eye, with a thin chain to the cheek.'`, `slot: 'face'`, `price: 150`.
2. `draw(g, w)` exactly (same eye coordinates/ring size as `round-glasses.ts:15-19`; `w.time`/`w.speed`/`w.seed` are the sway inputs `heart-shades.ts:19` uses):
```ts
const r = w.radius;
const cx = 0.34 * r, cy = -0.12 * r, ring = 0.32 * r;
g.lineCap = 'round';
g.beginPath();
g.arc(cx, cy, ring, 0, Math.PI * 2);
g.strokeStyle = w.ink;
g.lineWidth = Math.max(3, r * 0.12);      // ink outline both sides of the ring
g.stroke();
g.strokeStyle = PALETTE.yellow;          // 'A gold lens': the palette yellow, as it is
g.lineWidth = Math.max(1.5, r * 0.08);   // same ring weight as the Round Glasses frames
g.stroke();                               // no fill: the centre stays clear, eye visible
const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.05 * r;
const ex = 0.46 * r + sway, ey = 0.55 * r;
g.beginPath();
g.moveTo(cx, cy + ring);                 // bottom of the lens rim
g.lineTo(ex, ey);                        // down the cheek
g.strokeStyle = w.ink;
g.lineWidth = Math.max(1, r * 0.03);
g.stroke();
g.beginPath();
g.arc(ex, ey, r * 0.04, 0, Math.PI * 2); // the little ink dot
g.fillStyle = w.ink;
g.fill();
```
3. Add the import line + registry line to `index.ts` (above).

### Pitfalls
- One yellow stroke per arc, one ink outline: never stroke the same circle twice in yellow; the ink pass must come first (wider), then yellow (thinner) on the same path, or the lens reads as ink, not gold.
- No `g.fill()` of the ring centre, no second lens: it must read against `round-glasses` (two ink rings, no chain) at a glance.
- Sway on the chain end only, ≤ 0.05 r at full speed (`Math.min(1, w.speed / 200)` clamps it); the ring stays fixed like the glasses.
- End dot at 0.55 r stays inside the face and far from the name above the head (2-r radius rule); it changes nothing in play (draw-only, no stats/size).
- Face slot has 4 items (cap 10); no `palette.ts`/`rules.ts` edits (yellow already exists, `#ffd43b`).

### Tests
- none
