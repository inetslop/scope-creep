---
id: T0021
title: "First shop stock: two patterns, a face and a back accessory"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T04:17:26Z
claimed_at: 2026-10-31T05:33:02Z
finished_at: 2026-10-31T05:40:12Z
epic: E6
---

## Goal
The shop has something to sell: two patterns and two accessories with prices, seen on bots the moment they land, ready for the shop panel.

## Details
- Two patterns, each painted over the body in the player's own color, clipped to it (one file each):
  - **Spots** — description "Five dark dots on the body." — price 30. Look: 5 dots, each about a quarter of the body wide, darker than the body color, scattered (two high, two middle, one low); never over the face.
  - **Bands** — description "Two light bands across the body." — price 30. Look: 2 horizontal bands, lighter than the body color, each about a fifth of the body high, one just below the eyes and one across the belly.
  - Both must read on all 10 player colors (that is what darker/lighter is for) and at a player's 36 units across.
- Two accessories (one file each; the head slot stays out of this task — the starter hats are T0017's):
  - **Round Glasses** — description "Round ink frames around the eyes." — slot face, price 80. Look: two ink-outlined circles around the eyes with a small bridge over the nose; it sits over the eyes and never covers them.
  - **Candy Pack** — description "A little green pack on the back." — slot back, price 100. Look: a round green satchel behind the body, about three quarters of the body wide, ink outline, a small yellow buckle; bobs a little with movement; never covers the face or the name.
- No comparison rows are needed: no pattern, face or back accessory exists yet, and this task touches no head item.
- Prices against what a match earns (T0019: a new player about 60–120 coins a match, a good one 150–250): a pattern at 30 is a first-match goal, the glasses at 80 and the pack at 100 take a few matches. Later stock stays in the 25–150 range until a real goal item exists.
- They change nothing in play: no stats, no size, no behavior. Bots wear things at random, so the field shows them the moment they land.

## Acceptance criteria
- [ ] Spots (5 dark dots, 30 coins) and Bands (2 light bands, 30 coins) exist, read on all 10 player colors, and never cover the face.
- [ ] Round Glasses (face, 80 coins) and Candy Pack (back, 100 coins) exist with the looks above; the glasses sit around the eyes, never over them.
- [ ] In a fresh match, within about a minute a bot wearing the glasses and a bot wearing Spots or Bands are visible on the field.
- [ ] Each item has a one-line shop description and a name of at most 18 characters.
- [ ] Nothing in the match changes because of them: no stats, no size, no behavior.

## Design (architect, desktop)

### Files
- create `src/content/patterns/spots.ts` — pattern `id: 'spots'` (5 dark dots, 30 coins)
- create `src/content/patterns/bands.ts` — pattern `id: 'bands'` (2 light bands, 30 coins)
- create `src/content/accessories/round-glasses.ts` — accessory `id: 'round-glasses'`, slot `face`, 80 coins
- create `src/content/accessories/candy-pack.ts` — accessory `id: 'candy-pack'`, slot `back`, 100 coins
- edit `src/content/patterns/index.ts` — add the two imports and two array lines (exact content in Steps)
- edit `src/content/accessories/index.ts` — add the two imports and two array lines (exact content in Steps)

### Interfaces
No new types. The four defs use `PatternDef` / `AccessoryDef` from `engine/api.ts`; `draw(g, w)` draws only from `w` (`WearView`: `radius`, `color`, `ink`, `time`, `seed`, `angle`, `speed`). Verified coordinate facts (from `drawCritter`/`drawFace` in `engine/api.ts`):
- Player body: circle, radius `r = w.radius` (36 units across ⇒ r=18); origin at body centre, +y down.
- Eyes: white circles radius `0.26r` centred `(±0.34r, -0.12r)`; pupils never leave the white. Blush circles `0.14r` at `(±0.56r, 0.22r)`; mouth none.
- Pattern `draw()` runs clipped to the body, under the outline and under the face — the face can never be covered; don't clip manually.
- `back` accessories draw **before** the body (only the crescent outside the body circle is visible); `face` accessories draw **after** the face (on top).
- The player's name renders at ≥ `r` above the centre — never extend a back item upward past the centre.
- Bots dress at random per slot (engine `sim/match.ts` `botWear`, 40% per slot, 30% pattern) — nothing to build for the "visible on the field" criterion.

### Steps
1. Create `src/content/patterns/spots.ts` exactly:
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const spots: PatternDef = {
  id: 'spots',
  name: 'Spots',
  description: 'Five dark dots on the body.',
  price: 30,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, -0.3);
    for (const [x, y] of [[-0.52, -0.64], [0.52, -0.64], [-0.82, -0.28], [0.82, -0.28], [0, 0.8]] as const) {
      g.beginPath();
      g.arc(x * r, y * r, r * 0.22, 0, Math.PI * 2);
      g.fill();
    }
  },
};
```
2. Create `src/content/patterns/bands.ts` exactly:
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';

export const bands: PatternDef = {
  id: 'bands',
  name: 'Bands',
  description: 'Two light bands across the body.',
  price: 30,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.fillRect(-r, -0.35 * r, r * 2, r * 0.4);
    g.fillRect(-r, 0.42 * r, r * 2, r * 0.4);
  },
};
```
3. Create `src/content/accessories/round-glasses.ts` exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';

export const roundGlasses: AccessoryDef = {
  id: 'round-glasses',
  name: 'Round Glasses',
  description: 'Round ink frames around the eyes.',
  slot: 'face',
  price: 80,
  draw(g, w) {
    const r = w.radius;
    g.strokeStyle = w.ink;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.lineCap = 'round';
    g.beginPath();
    g.arc(-0.34 * r, -0.12 * r, 0.32 * r, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(0.34 * r, -0.12 * r, 0.32 * r, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(-0.05 * r, -0.14 * r);
    g.lineTo(0.05 * r, -0.14 * r);
    g.stroke();
  },
};
```
4. Create `src/content/accessories/candy-pack.ts` exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const candyPack: AccessoryDef = {
  id: 'candy-pack',
  name: 'Candy Pack',
  description: 'A little green pack on the back.',
  slot: 'back',
  price: 100,
  draw(g, w) {
    const r = w.radius;
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.12 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.green;
    g.beginPath();
    g.arc(sway, 0.5 * r, 0.75 * r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = w.ink;
    g.stroke();
    g.fillStyle = PALETTE.yellow;
    g.beginPath();
    g.arc(sway, 1.12 * r, 0.13 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  },
};
```
5. Replace `src/content/patterns/index.ts` with exactly:
```ts
import type { PatternDef } from '../../../engine/api.ts';
import { bands } from './bands.ts';
import { spots } from './spots.ts';

/** Color patterns painted over a player's body. One per line. */
export const PATTERNS: readonly PatternDef[] = [
  bands,
  spots,
];
```
6. Replace `src/content/accessories/index.ts` with exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { candyPack } from './candy-pack.ts';
import { roundGlasses } from './round-glasses.ts';

/** Everything players can wear on their head, face or back (hats and more). One per line. */
export const ACCESSORIES: readonly AccessoryDef[] = [
  candyPack,
  roundGlasses,
];
```
7. Run `npm run check`.

### Pitfalls
- Copy the snippets verbatim; the spot/band/lens positions were computed against the eye and blush circles — moving them can push a dot or band under the face.
- No `Math.random`/`Date`/`performance` in `src/content`; the candy-pack bob uses only `w.time`, `w.speed`, `w.seed` (tests call draw at `time` 0 and 2.7 — it must not throw and must stay finite).
- Keep the pack below the centre (y > 0): the name sits above the player, so an angle-based "opposite the heading" pack would cover the name when a player faces down. Do not add it.
- Only `shade(w.color, …)` and `PALETTE` colors; the patterns must not import `PALETTE` (they paint in the player's own color).
- Names ≤18 and descriptions ≤70 characters and integer prices are enforced by the content tests; file name = item id, export = camelCase id.
- Face/back slots and the pattern list are currently empty, so no "compared with what exists" rows exist to write (task pre-approved); add no head item — that is T0017's file territory.

### Tests
- none (engine/tests/ automatically checks file/registry layout, shop data, and runs each draw; no pure helpers are added here).

## Result (attempt 1, cachyos-x8664)

Added the first shop stock: two patterns (`src/content/patterns/spots.ts`, 5 dark dots, 30 coins; `src/content/patterns/bands.ts`, 2 light bands, 30 coins) and two accessories (`src/content/accessories/round-glasses.ts`, face slot, 80 coins; `src/content/accessories/candy-pack.ts`, back slot, 100 coins), each registered in its folder's `index.ts`. Patterns shade the player's own color so they read on all 10 colors and the engine draws them clipped to the body under the face; the glasses ring the eye circles (r 0.32r around the 0.26r whites, drawn after the face so they sit over the eyes without covering them) and the pack bobs via `w.time`/`w.speed`/`w.seed` below the centre. Bots dress at random per slot, so items appear on the field the moment they land; nothing in play changes (draw-only).

- Self-review: APPROVE
- Time: 7.2 min

```
.../game/src/content/accessories/candy-pack.ts     | 26 ++++++++++++++++++++++
 .../game/src/content/accessories/index.ts          |  7 +++++-
 .../game/src/content/accessories/round-glasses.ts  | 25 +++++++++++++++++++++
 .../draft-arena/game/src/content/patterns/bands.ts | 14 ++++++++++++
 .../draft-arena/game/src/content/patterns/index.ts |  7 +++++-
 .../draft-arena/game/src/content/patterns/spots.ts | 17 ++++++++++++++
 6 files changed, 94 insertions(+), 2 deletions(-)
```
