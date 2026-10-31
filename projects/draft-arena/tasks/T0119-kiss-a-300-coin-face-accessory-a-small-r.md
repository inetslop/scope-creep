---
id: T0119
title: "Kiss: a 300-coin face accessory, a small red kiss mark on the cheek"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T20:09:56Z
epic: E26
---

## Goal
The face slot gets its 7th item and the shop's face ladder fills its 200→350 gap: a small red kiss mark on the cheek, so a player with a few lives always has a next save on the face shelf.

## Details
- **Kiss** is a face-slot accessory, **300 coins, no prestige lock**. Name "Kiss" (4 characters), description "A small red kiss mark on the cheek."
- **New file `src/content/accessories/kiss.ts`** — the closest example is `src/content/accessories/heart-shades.ts` (a 200-coin face item in the same slot). Register it in `src/content/accessories/index.ts` the same way: one import and one registry line, placed in price order (after Heart Shades, before Mustache).
- **Look:** a small red kiss on the **right cheek** — two little red lips drawn as a shallow "w" (about 0.18 of the critter's radius wide), ink-outlined, sitting at cheek height: below and beside the eye, clear of the mouth. It is a kiss on the cheek, not another mouth. A tiny time/seed bob, smaller and slower than the Candy's. Palette colors only (red, ink, a white glint), no glow.
- **Draw-only:** no stat, size or hitbox change, exactly like every other accessory.
- The face ladder becomes: 80 (Round Glasses, Bow Tie), 100 (Beak), 150 (Monocle), 200 (Heart Shades), **300 (Kiss)**, 350 (Mustache) — no gap bigger than 150 between 80 and 400. Face slot count: 7 of 10.

## Compared with what exists
One row for every accessory in the face slot:

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Round Glasses | a face item | round ink frames around both eyes; Kiss is a small red mark on one cheek, away from the eyes |
| Bow Tie | a face item at the mouth | a red bow at the mouth; Kiss is on the cheek, above and beside the mouth, and is lips not a bow |
| Beak | a face item below the eyes | an orange triangle under both eyes; Kiss is two little red lips on one cheek, no triangle |
| Monocle | a one-sided face item | a gold lens over one eye with a chain; Kiss sits off the eye entirely, on the cheek, red lips not a lens |
| Heart Shades | a pink face item around the eyes | pink heart frames around both eyes; Kiss is red, on the cheek, a mark not a frame |
| Mustache | a face item near the mouth | a curly pink mustache over the mouth; Kiss is on the cheek, above the mouth's line |

## Acceptance criteria
- [ ] The Cosmetics panel lists Kiss on the face shelf at 300 coins; buying it spends 300 coins and wears it on the preview critter and on the player in-match; it is owned and worn on the next visit.
- [ ] A Kiss-wearing critter shows a small red kiss on the right cheek (two little ink-outlined red lips), clear of the eyes and the mouth, readable at a player's 36-unit size.
- [ ] It changes nothing in play: a player with Kiss plays identically to the same build without it (no stat, size or hitbox change).
- [ ] Bots can wear it, and it shows on the in-match crowd.
- [ ] A new test `tests/kiss.test.ts` (the closest example: `tests/candy.test.ts`) locks the face slot, the 300-coin price and the absence of a prestige lock.

## Design (architect, yoga)

### Files
- create `src/content/accessories/kiss.ts` - the kiss `AccessoryDef` (face slot, 300 coins, no `prestige`)
- edit `src/content/accessories/index.ts` - one import line + one `ACCESSORIES` line, price order: after `heartShades,`, before `mustache,`
- create `tests/kiss.test.ts` - locks slot, price, absence of a prestige lock, name and description
### Interfaces
No new or changed types. Uses the existing `AccessoryDef` (`draw(g: CanvasRenderingContext2D, w: WearView)`) and `PALETTE` (`red`, `white`); no engine, menu or rules change.
### Steps
1. Create `src/content/accessories/kiss.ts` with exactly this code:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const kiss: AccessoryDef = {
  id: 'kiss',
  name: 'Kiss',
  description: 'A small red kiss mark on the cheek.',
  slot: 'face',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.sin(w.time * 1.5 + w.seed * 6.283) * 0.025 * r;
    const cx = 0.52 * r; // right cheek: below and beside the eye, above the mouth line
    const cy = 0.24 * r + bob;
    g.lineCap = 'round';
    // Two little red lips: a shallow "w" across the cheek, ink-outlined.
    for (const side of [-1, 1] as const) {
      g.beginPath();
      g.arc(cx + side * 0.045 * r, cy, 0.045 * r, 0, Math.PI); // lower half-disk: the lip bump
      g.closePath();
      g.fillStyle = PALETTE.red;
      g.fill();
      g.strokeStyle = w.ink;
      g.lineWidth = Math.max(1.5, r * 0.06);
      g.stroke();
    }
    // A tiny white glint on the left lip.
    g.beginPath();
    g.arc(cx - 0.04 * r, cy + 0.015 * r, 0.014 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.white;
    g.fill();
  },
};
```
2. Edit `src/content/accessories/index.ts`: add `import { kiss } from './kiss.ts';` after the `heart-shades` import; in `ACCESSORIES` add `kiss,` after the `heartShades,` line and before the `mustache,` line. Two lines, nothing else.
3. Create `tests/kiss.test.ts` (copy of `tests/candy.test.ts` adapted):
```ts
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';

/** The kiss: the face shelf's step between Heart Shades and Mustache. */
describe('kiss accessory', () => {
  it('is a face accessory, 300 coins, no prestige lock', () => {
    const kiss = CONTENT.accessories.find((a) => a.id === 'kiss');
    expect(kiss, 'the kiss is registered').toBeTruthy();
    expect(kiss!.slot).toBe('face');
    expect(kiss!.price).toBe(300);
    expect(kiss!.prestige).toBeUndefined();
    expect(kiss!.name.length).toBeLessThanOrEqual(18);
    expect(kiss!.description).toBe('A small red kiss mark on the cheek.');
  });
});
```
4. Run `npm run check`.
### Pitfalls
- The arc `0 → Math.PI` is what makes each lip a lower half-disk (the "w"); never `Math.PI * 2` there, or each lip becomes a full circle.
- Colors only `PALETTE.red`, `w.ink`, `PALETTE.white`; no glow, exactly one ink stroke per shape; no `Math.random`/`Date` in draw (animate from `w.time` only).
- Geometry is fixed: right cheek at `cx = +0.52r`, `cy = 0.24r` — beside the eye (eye at `0.34r, -0.12r`), clear of the mouth line (`y = 0.42r`); total width 0.18r; bob is smaller and slower than Candy's (0.025r @ 1.5, Candy's 0.05r @ 2).
- Do not touch `src/menu/shop.ts`: the face shelf renders itself from the registry in order, the preview and buy/wear are automatic, and bots dress randomly from the same registry.
- Do not reformat or reorder `index.ts` beyond the two added lines.
### Tests
`tests/kiss.test.ts` (named in the task; content bar and draw are auto-checked by `engine/tests/`).
