---
id: T0101
title: "Cherry: a 450-coin head accessory, a red cherry with a green stem"
assignee: inet-racing
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T17:06:34Z
claimed_at: 2026-10-31T17:27:23Z
epic: E22
---

## Goal
The head slot gets its top item — the shop's first head long goal: a red cherry on the head, buyable only after a prestige in all, so the shop's ladders reach past the 300-coin Chef Hat.

## Details
- A new head accessory in the Cosmetics panel: name "Cherry", slot head, price 450, prestige 1 (buyable only after 1 prestige in all, like the Medal's "Needs 2 prestiges in all"), description "A red cherry with a green stem on the head. Needs 1 prestige in all."
- How it looks: a small red ball (a cherry, roughly one quarter of the head's width) resting on top of the head, slightly off-centre; a short green stem curves up out of the top of the ball; one small white shine on the ball; ink outline on ball and stem; at most a gentle bounce with the critter. The head stays visible underneath, the eyes are never covered, and nothing reaches more than one radius above the head (the name sits above that).
- A new file `src/content/accessories/cherry.ts`, modelled on the closest existing file `src/content/accessories/bloom.ts` (a single thing resting on the head), plus one import and one line in `src/content/accessories/index.ts` after the chef-hat line, so the head row reads 0, 0, 120, 150, 300, 450 and stays price-ascending in the shop.
- It changes nothing in play: no stats, no size, no HUD. Buying, wearing, persistence and bot dressing come from the generic accessories iteration.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Cone | sits on the head | a yellow party cone with a red tip; the Cherry is a small round ball with a green stem, the head shape stays visible |
| Beanie | on the head | a purple dome that covers the top of the head with a pink pom; the Cherry is a small ball resting on the head, no dome |
| Feather | a single thing resting on the head | a pink leaf with a quill line; the Cherry is a round red ball with a curved stem, no leaf shape |
| Bloom | a single thing on the head | five pink petals around a yellow centre; the Cherry is one ball plus a stem, no petals |
| Chef Hat | sits on the head | a tall white puff that covers the head; the Cherry is small, round and low, the head is still the hat's base |

## Acceptance criteria
- [ ] The Cosmetics panel's head row shows the Cherry last at 450 coins; before the profile has 1 prestige in all it is stamped "Needs 1 prestige in all" and can't be bought, and after it, it buys for 450 coins.
- [ ] Worn, the player's critter in the match shows the red cherry with the green stem on the head: the eyes stay clear, the name above the head is not covered, and bots can wear it at random.
- [ ] Buying, wearing and taking it off are kept for the next visit, and it changes nothing in play.

## Design (architect, yoga)

### Files
- create `src/content/accessories/cherry.ts` — the Cherry head accessory (`AccessoryDef`), modelled on `bloom.ts`
- edit `src/content/accessories/index.ts` — one import + one registry line, both after the chef-hat line

### Interfaces
- No new types. `cherry: AccessoryDef` exported from `cherry.ts`:
```ts
id: 'cherry'; name: 'Cherry';
description: 'A red cherry with a green stem on the head. Needs 1 prestige in all.';
slot: 'head'; price: 450; prestige: 1;
```

### Steps
1. Write `src/content/accessories/cherry.ts` exactly (same imports as `bloom.ts`):
```ts
/** A red cherry with a green stem resting on the top of the head, slightly off-centre. */
export const cherry: AccessoryDef = {
  id: 'cherry',
  name: 'Cherry',
  description: 'A red cherry with a green stem on the head. Needs 1 prestige in all.',
  slot: 'head',
  price: 450,
  prestige: 1,
  draw(g, w) {
    const r = w.radius;
    const s = 1 + 0.05 * Math.sin(w.time * 2 + w.seed * 6.283);
    const cx = 0.12 * r;
    const cy = -1.25 * r;
    g.lineCap = 'round';
    // The green stem out of the top of the ball: an ink curve, then the green on top.
    for (const [lw, style] of [[0.25 * r, w.ink], [0.09 * r, PALETTE.green]]) {
      g.lineWidth = lw;
      g.strokeStyle = style;
      g.beginPath();
      g.moveTo(cx, (cy - 0.15) * r);
      g.quadraticCurveTo(cx + 0.05 * r, cy - 0.55 * r, cx + 0.24 * r, cy - 0.62 * r);
      g.stroke();
    }
    // The red ball, over the stem's base.
    g.beginPath();
    g.arc(cx, cy, 0.25 * r * s, 0, Math.PI * 2);
    g.fillStyle = PALETTE.red;
    g.fill();
    g.lineWidth = 0.08 * r;
    g.strokeStyle = w.ink;
    g.stroke();
    // One small white shine.
    g.beginPath();
    g.arc(cx - 0.09 * r, cy - 0.1 * r, 0.06 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
```
2. In `src/content/accessories/index.ts`: add `import { cherry } from './cherry.ts';` after the `chefHat` import, and `cherry,` after the `chefHat,` line in `ACCESSORIES` (head row then reads 0, 0, 120, 150, 300, 450, price-ascending in the shop).
3. Run `npm run check`; content tests cover it automatically (registered, drawn in a match, bots dress in it).

### Pitfalls
- Draw the ball after the stem so the ball's ink stroke joins the stem cleanly (one shared outline, no crossing lines).
- Stay within the head budget: ball rests at `y = -1.25r` (top of head is `-r`), stem tip at `-1.87r`, never past `-2r` (name sits above that); nothing near the eyes.
- Animate only from `w.time`/`w.seed` (no `Math.random`); scale bounce 5%, under the 20% cap.
- `description` must keep the exact "Needs 1 prestige in all." text; the shop's "needs a prestige" stamp comes from the engine's `cantBuy` via the `prestige: 1` field (like `medal.ts`).

### Tests
none
