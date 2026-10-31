---
id: T0031
title: "Second shop stock: two patterns, a face and a back accessory"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T06:30:37Z
claimed_at: 2026-10-31T07:27:53Z
finished_at: 2026-10-31T07:32:05Z
epic: E6
---

## Goal
The shop gets a second shelf: four more looks to spend coins on — two patterns, a face accessory and a back accessory — so a new player has a cheap next goal and a good player has a few-match one.

## Details
Four new items, draw-only (nothing in play changes; the closest example is T0021's first stock). Each is one file in its folder, registered in its index:
- **Belly** — pattern, price 40. Description "A light round patch on the lower body." Look: one round patch about half the body wide, lighter than the player's own color, centred on the lower body below the face.
- **Party** — pattern, price 40. Description "A light zigzag across the top, like a paper party hat." Look: a zigzag band of 5 peaks across the top of the body, above the eyes, lighter than the player's own color.
- **Bow Tie** — accessory, slot face, price 80. Description "A red bow tie at the mouth." Look: two red triangles with a small square knot in the middle, ink outlined, sitting at the mouth — below the eyes, never over them or the blush.
- **Balloon** — accessory, slot back, price 120. Description "A small yellow balloon bobbing on the back." Look: a round yellow balloon about half the body wide, behind the body and below its centre (like the Candy Pack's spot), ink outlined, bobbing a little more with the walk, with a small knot where its string meets the body.
- Patterns paint in the player's own color (lighter shade) so they read on all 10 player colors, clipped to the body, under the face and outline. Bots dress at random per slot, so every item appears on the field the moment it lands.
- Prices against what a match earns (T0019: a new player about 60–120 coins a match, a good one 150–250): 40 is a first-match goal, 80 a couple of matches, 120 a few matches — inside the 25–150 range until a real goal item exists.

## Compared with what exists
Patterns:

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Bands | shapes painted lighter than the player's color | Bands are two straight horizontal bands (one below the eyes, one across the belly); Belly is one round patch on the lower body and Party is a zigzag across the top |
| Spots | a few shapes painted in the player's color family | Spots are five dark dots scattered over the body; Belly and Party are lighter, not dark, and fixed to one place (lower centre, top) instead of scattered |

Accessories:

| Existing | What it shares | How the new one looks different |
| --- | --- | --- |
| Round Glasses | a face-slot item with ink outlines | the glasses ring the eyes; the Bow Tie sits below them at the mouth, red and bow-shaped |
| Candy Pack | a back-slot item that bobs with the walk | the pack is a wide green satchel with a yellow buckle; the Balloon is a smaller round yellow bubble with a knot, and it bobs more |

## Acceptance criteria
- [ ] Belly (40) and Party (40) exist as patterns, read on all 10 player colors, and never cover the face.
- [ ] Bow Tie (face, 80) and Balloon (back, 120) exist with the looks above; the bow tie never covers the eyes or the blush, and the balloon sits behind and below the centre of the body.
- [ ] In a fresh match, within about a minute a bot wearing the Bow Tie and a bot wearing Belly or Party are visible on the field.
- [ ] Each item has a one-line shop description and a name of at most 18 characters; nothing in the match changes because of them.

## Design (architect, desktop)

### Files
- create `src/content/patterns/belly.ts` - pattern `belly`, price 40
- create `src/content/patterns/party.ts` - pattern `party`, price 40
- create `src/content/accessories/bow-tie.ts` - face accessory `bow-tie`, price 80
- create `src/content/accessories/balloon.ts` - back accessory `balloon`, price 120
- edit `src/content/patterns/index.ts` - import `belly`, `party`; add one line each to `PATTERNS` after `spots,`
- edit `src/content/accessories/index.ts` - import `bowTie`, `balloon`; add one line each to `ACCESSORIES` after `roundGlasses,`

### Interfaces
No new types. Use existing `PatternDef`, `AccessoryDef`, `WearView`, `shade`, `PALETTE`. Exact contents:

belly.ts:
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';
export const belly: PatternDef = {
  id: 'belly', name: 'Belly', description: 'A light round patch on the lower body.', price: 40,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.arc(0, 0.6 * r, 0.5 * r, 0, Math.PI * 2);
    g.fill();
  },
};
```
party.ts:
```ts
import { shade, type PatternDef } from '../../../engine/api.ts';
export const party: PatternDef = {
  id: 'party', name: 'Party', description: 'A light zigzag across the top, like a paper party hat.', price: 40,
  draw(g, w) {
    const r = w.radius;
    g.fillStyle = shade(w.color, 0.35);
    g.beginPath();
    g.moveTo(-r, -0.42 * r);
    g.lineTo(-r, -0.6 * r);
    g.lineTo(-0.8 * r, -0.85 * r); g.lineTo(-0.6 * r, -0.6 * r);
    g.lineTo(-0.4 * r, -0.85 * r); g.lineTo(-0.2 * r, -0.6 * r);
    g.lineTo(0, -0.85 * r); g.lineTo(0.2 * r, -0.6 * r);
    g.lineTo(0.4 * r, -0.85 * r); g.lineTo(0.6 * r, -0.6 * r);
    g.lineTo(0.8 * r, -0.85 * r); g.lineTo(r, -0.6 * r);
    g.lineTo(r, -0.42 * r);
    g.closePath();
    g.fill();
  },
};
```
bow-tie.ts:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
export const bowTie: AccessoryDef = {
  id: 'bow-tie', name: 'Bow Tie', description: 'A red bow tie at the mouth.', slot: 'face', price: 80,
  draw(g, w) {
    const r = w.radius;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.lineJoin = 'round';
    g.fillStyle = PALETTE.red;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.moveTo(-0.08 * r, 0.34 * r); g.lineTo(-0.42 * r, 0.42 * r); g.lineTo(-0.08 * r, 0.5 * r);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(0.08 * r, 0.34 * r); g.lineTo(0.42 * r, 0.42 * r); g.lineTo(0.08 * r, 0.5 * r);
    g.closePath(); g.fill(); g.stroke();
    g.beginPath();
    g.rect(-0.07 * r, 0.35 * r, 0.14 * r, 0.14 * r);
    g.fill(); g.stroke();
  },
};
```
balloon.ts:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
export const balloon: AccessoryDef = {
  id: 'balloon', name: 'Balloon', description: 'A small yellow balloon bobbing on the back.', slot: 'back', price: 120,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.15 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.yellow;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.arc(0, (1.05 + (bob / r)) * r, 0.5 * r, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.beginPath();
    g.moveTo(0, 0.98 * r); g.lineTo(0.08 * r, 1.06 * r); g.lineTo(0, 1.14 * r); g.lineTo(-0.08 * r, 1.06 * r);
    g.closePath(); g.fill(); g.stroke();
  },
};
```

### Steps
1. Create the four files exactly as above (one item per file, export name = id in camelCase).
2. Add the two registry imports + lines to `src/content/patterns/index.ts` (after `spots,`).
3. Add the two registry imports + lines to `src/content/accessories/index.ts` (after `roundGlasses,`).
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Balloon is a `back` slot: drawn BEHIND the body, so only the crescent below the body's rim is visible. That is intended — do not move the balloon above the body or enlarge it. Balloon centre stays at 1.05r±0.15r, radius 0.5r (never past 2 radii); do not use `w.time`/`w.seed` anywhere except the one `bob` line.
- The knot is fixed at (0, 1.06r) (where the string meets the body), NOT attached to the bobbing balloon — it must not move with `bob`.
- Bow tie is `face` slot: drawn ON TOP of the face. Keep the exact y-range 0.34r–0.50r (eyes end at 0.14r, blush inner edge at ~0.46r from centre); do not raise or widen the wings.
- Patterns are clipped to the body and painted under face/outline — never stroke the body outline or draw outside; never use `PALETTE` for pattern fills (must be `shade(w.color, 0.35)` so they read on all 10 player colors).
- No `Math.random`, no module-level state; draw hooks are pure drawing only. Registry lines: exactly one per line, do not reformat the array or other tasks' lines.

### Tests
- none (all four items are content, tested automatically by `engine/tests/` plus the smoke test).

## Result (attempt 1, desktop)

Added a second shop shelf with four draw-only cosmetics: patterns Belly and Party (40 coins each, painted lighter than the player's own color via `shade`), face accessory Bow Tie (80, red bow at the mouth below the eyes), and back accessory Balloon (120, yellow balloon bobbing behind the body with a fixed knot). Each is one file in its folder plus one line in its registry (`src/content/patterns/index.ts`, `src/content/accessories/index.ts`); the shop and bot dressing pick them up automatically. `npm run check` (77 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 4.2 min

```
.../game/src/content/accessories/balloon.ts        | 23 +++++++++++++++++++
 .../game/src/content/accessories/bow-tie.ts        | 26 ++++++++++++++++++++++
 .../game/src/content/accessories/index.ts          |  4 ++++
 .../draft-arena/game/src/content/patterns/belly.ts | 15 +++++++++++++
 .../draft-arena/game/src/content/patterns/index.ts |  4 ++++
 .../draft-arena/game/src/content/patterns/party.ts | 23 +++++++++++++++++++
 6 files changed, 95 insertions(+)
```
