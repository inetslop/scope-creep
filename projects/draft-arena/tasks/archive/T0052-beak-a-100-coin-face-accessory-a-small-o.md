---
id: T0052
title: "Beak: a 100-coin face accessory, a small orange beak below the eyes"
assignee: asus
size: S
priority: 2
status: done
depends_on: []
attempts: 2
created: 2026-10-31T10:32:35Z
claimed_at: 2026-10-31T11:12:10Z
finished_at: 2026-10-31T11:25:01Z
---

## Goal
The face slot is the shop's thinnest shelf (two items): give it a third — a bold, readable face at the mid price step.

## Details
- A new face accessory "Beak" (id beak): a small solid orange beak, a short pointed triangle, at the center of the face below the eyes and just above the mouth, inked, with at most a little bounce from time and seed like the other accessories. It never covers the eyes.
- Price: 100 coins (between the 80-coin face items and the 120-coin Balloon). No prestige gate.
- One new file plus a one-line registry entry next to the other face items. The closest example is the Round Glasses accessory in the same slot; the shop, the hats card, bot wearing and profile persistence pick it up from the registry with no other edits.
- ## Compared with what exists
  | Existing | What it shares | How the new one looks different (not a recolor) |
  | --- | --- | --- |
  | Round Glasses | sits on the face, inked | two open round frames around the eyes; the beak is a solid orange point below them |
  | Bow Tie | sits at the mouth in a candy color | two red loops and a knot at the mouth; the beak is a single orange point above the mouth |

## Acceptance criteria
- [ ] The shop sells the Beak at 100 coins; buying it makes it wearable, the choice is kept for the next visit, and a critter wearing it reads as a clear orange point below the eyes in a crowd.
- [ ] It shows on all 10 player colors with the ink outline and the face drawn on top, and bots wear it at random like the other face items.
- [ ] It changes nothing in play.

## Design (architect, yoga)

### Files
- create `src/content/accessories/beak.ts` - the face accessory `beak` (100 coins, no prestige): a small solid orange triangle (beak) at face center, below the eyes, above the mouth
- edit `src/content/accessories/index.ts` - one import + one list line, both next to the other face items

### Interfaces
No new types. The new item is an `AccessoryDef`:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const beak: AccessoryDef = {
  id: 'beak',
  name: 'Beak',
  description: 'A small orange beak below the eyes.',
  slot: 'face',
  price: 100,
  draw(g, w) {
    const r = w.radius;
    const dip = Math.sin(w.time * 3 + w.seed) * 0.02 * r;
    g.lineJoin = 'round';
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.orange;
    g.strokeStyle = w.ink;
    g.beginPath();
    g.moveTo(-0.16 * r, 0.18 * r + dip);
    g.lineTo(0, 0.42 * r + dip);
    g.lineTo(0.16 * r, 0.18 * r + dip);
    g.closePath();
    g.fill();
    g.stroke();
  },
};
```

### Steps
1. Create `beak.ts` exactly as above (copy `bow-tie.ts`'s shape: same imports, same field order, same `lineWidth`/fill/stroke idiom).
2. In `index.ts`: add `import { beak } from './beak.ts';` after the `bowTie` import, and `beak,` after `bowTie,` in `ACCESSORIES` (next to the other face items, before `balloon,`).

Shop, hats card, bot wearing (`botWear` dresses bots at random from `ACCESSORIES`) and profile persistence all read the registry — no other edits.

### Pitfalls
- Eyes (2 of them) end at y = 0.14r; the beak's top edge must stay below them: base 0.18r, bounce ±0.02r → never above 0.16r. Never let the triangle reach the eye circles.
- Bounce is the only animation: `w.time` + `w.seed` only (no `Math.random`/`Date` in `src/content/`, lint fails); amplitude ≤ 0.02r ("at most a little bounce", cf. `balloon.ts`).
- Colors: `PALETTE.orange` fill, `w.ink` stroke only; inked outline is required.
- One item per file: `beak.ts` holds only `beak`, exported in camelCase; registry gets exactly one import and one list line. Face slot goes to 3/10 accessories — cap fine.
- No gameplay fields (`price`/`slot`/`draw` only) — it must change nothing in play.

### Tests
- none (content is tested automatically by `engine/tests/`: it draws every accessory and checks the registry/one-per-file rule).

## Attempt 1 failed (asus)

Runner error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 2e828cdd9ded203493331d5e83bb581ffaaac79c but expected 139415477ecb4f3e5cde581132174604b6ba6044


```
Error: git fetch --quiet --prune origin failed (exit 1):
error: cannot lock ref 'refs/remotes/origin/main': is at 2e828cdd9ded203493331d5e83bb581ffaaac79c but expected 139415477ecb4f3e5cde581132174604b6ba6044

    at Git.fetch (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/git.ts:134:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async integrate (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:260:5)
    at async runDevTask (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:144:21)
    at async main (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/runner.ts:154:9)
```

## Result (attempt 2, asus)

Added the Beak face accessory (src/content/accessories/beak.ts) — a small solid orange triangle with an ink outline at face center, below the eyes and above the mouth, with a tiny time/seed bounce, priced at 100 coins with no prestige gate — and registered it in src/content/accessories/index.ts next to the other face items. The shop, hats card, bot wearing and profile persistence pick it up from the registry with no other edits; it changes nothing in play. npm run check and npm run smoke both pass.

- Self-review: APPROVE
- Time: 12.9 min

```
.../game/src/content/accessories/beak.ts           | 25 ++++++++++++++++++++++
 .../game/src/content/accessories/index.ts          |  2 ++
 2 files changed, 27 insertions(+)
```
