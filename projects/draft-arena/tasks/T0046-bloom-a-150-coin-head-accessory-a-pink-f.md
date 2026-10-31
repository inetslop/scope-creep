---
id: T0046
title: "Bloom: a 150-coin head accessory, a pink flower with a yellow center"
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T08:32:32Z
epic: E6
---

## Goal
A mid-price head item that fills the gap between the free hats and the 300-coin Chef Hat, so the head slot has a real purchase in the shop.

## Details
- Name: Bloom. Slot: head. Price: 150 coins.
- Description (shop, one line): "A pink flower with a yellow center on the head."
- Look: five rounded pink petals around a yellow center — a clear bloom silhouette, ink outline, at most a little bounce. It sits on the top of the head and reaches at most one radius above it (the player's name sits above that).
- It changes nothing in play: no stats, no size.
- It is drawn only (the same way Cone, Beanie and Chef Hat are), so it shows on the critter for everyone, including bots that wear it at random.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Chef Hat | a tall item on the head | Chef Hat is a tall white three-bump puff with an ink band. Bloom is a flat bloom of five pink petals around a yellow center — a flower, not a cloud. |
| Cone | a head item in solid colors | Cone is a single yellow party cone with a red tip ball. Bloom is a round multi-petal bloom (pink petals, yellow center), not a cone. |
| Beanie | a head item | Beanie is a purple dome and band with a pink pom on top. Bloom is an open flower — five petals around a center — not a dome, and it is pink-and-yellow, not purple. |

## Acceptance criteria
- [ ] The Hats card / shop sells "Bloom" at 150 coins, with a mini-critter preview showing a pink five-petal flower with a yellow center on the head.
- [ ] Wearing it, the critter shows the bloom on the top of the head; it never covers the eyes and reaches at most one radius above the head.
- [ ] In a crowd it reads as a clearly different silhouette from the Cone, Beanie and Chef Hat.
- [ ] It changes nothing in play (no stats, no size change).

## Design (architect, yoga)

### Files
- create `src/content/accessories/bloom.ts` - the accessory `id: 'bloom'`, `export const bloom: AccessoryDef`
- edit `src/content/accessories/index.ts` - one import line + one line in `ACCESSORIES`, next to `beanie`

### Interfaces
No new types. `bloom: AccessoryDef` exactly per `engine/api.ts`: `id: 'bloom'`, `name: 'Bloom'`, `description: 'A pink flower with a yellow center on the head.'`, `slot: 'head'`, `price: 150`, `draw(g, w)` drawing only.

### Steps
1. Copy the shape of `src/content/accessories/cone.ts` (shortest example). In `draw(g, w)`:
   - `const r = w.radius;` center `cx = 0`, `cy = -0.95 * r` (on the top of the head); bounce `s = 1 + 0.05 * Math.sin(w.time * 2 + w.seed * 6.283)`; `g.lineWidth = 0.12 * r; g.strokeStyle = w.ink; g.lineJoin = 'round';`
   - 5 petals: `for (let i = 0; i < 5; i++)` with `a = -Math.PI / 2 + i * 2 * Math.PI / 5`; petal = `g.arc(cx + Math.cos(a) * 0.22 * r * s, cy + Math.sin(a) * 0.22 * r * s, 0.24 * r * s, 0, Math.PI * 2)`, `g.fillStyle = PALETTE.pink; g.fill(); g.stroke();`
   - Then the yellow center on top: `g.arc(cx, cy, 0.17 * r, ...)`, `g.fillStyle = PALETTE.yellow; g.fill(); g.stroke();`
2. Registry: in `src/content/accessories/index.ts` add `import { bloom } from './bloom.ts';` after the `beanie` import, and add `bloom,` after the `beanie,` line in `ACCESSORIES`.

### Pitfalls
- Reach: petals top at `cy - (0.22+0.24) * r * s ≈ -1.45 r` at most (0.45 r above the head, ≤ 1 r, always < 2 radii from centre); bottom petals stop at ≈ `-0.5 r`, never over the eyes (which sit a little above the middle).
- Colors only from `PALETTE` (pink, yellow); ink via `w.ink`; no glow/gradient. No state, no `Math.random`; animation only from `w.time`/`w.seed`.
- Don't touch `src/menu/shop.ts` or any CSS: the Hats card lists `ACCESSORIES` automatically. Head slot has 4 items, under the cap of 10.

### Tests
none (content is tested automatically by engine/tests/).
