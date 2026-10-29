---
id: T0151
title: "The four-card draft: the card lines clear their icons"
assignee: baby-mama
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T10:13:21Z
claimed_at: 2026-10-29T10:37:39Z
---

## Goal
When the draft shows four cards (every 5th draft), the small icons in front of each card's two lines (the tower dot before the "as a tower" line, the plus before the "added" line) sit on top of the first letters of the text: "Shoots fast...", "Attacks 50% faster..." and "35% more range" all start under their icon. The four-card draft must read as cleanly as the three-card one.

## Details
- Where: `scenes/DraftScene.ts`, `buildRow`. In a four-card draft the card is narrower (165 px wide on desktop, 121 px in the phone's 2x2 grid), and the text start scales down with it (`textX = -cw / 2 + 42 * k`, `k = cw / CARD_W`), but the two icons are drawn at a fixed `-cw / 2 + 26` at full size (`drawTowerGlyph`, `drawPlusGlyph`), so the text slides under them.
- Fix: the icons and the text start move together. Either scale the icons' size and x with `k` like the text (icon centre at `-cw / 2 + 26 * k`, at `k` scale), or keep the icons at full size and start the text at least 6 px right of the icon's right edge, shrinking the wrap width by the same amount. Pick whichever keeps the 12 px text readable in the 121 px phone cards.
- The three-card draft is unchanged (pixel for pixel).
- The card's height still fits both lines after the change (the height is measured from the wrapped lines in pass 1, so measure with the final wrap width).

## Acceptance criteria
- [ ] In a four-card draft at 1280x720, no card line's first letter touches its icon; there are at least 6 px between each icon and its line on all four cards.
- [ ] The same in the phone's 2x2 grid at 412x915.
- [ ] Both lines stay inside the card, and the card still grows to fit the longest text (try Beam and Spray, which wrap to three lines).
- [ ] The three-card draft looks exactly as before.

## Design (architect, baby-mama)

### Files
- edit `src/scenes/DraftScene.ts` - in `buildRow`, replace lines 107–108 so the four-card text start and wrap width account for the full-size icons; nothing else in this file changes (icons on lines 141–142 stay as they are)

### Interfaces
No types or signatures change. Exact replacement of `src/scenes/DraftScene.ts:107-108`:

```ts
      // The four-card draft keeps its icons at full size, so the text starts 6 px right of the
      // icon's right edge (centre -cw/2 + 26, half-width 8 → right edge -cw/2 + 34), and the wrap
      // narrows by the same amount to keep the 16k right margin; the three-card keeps its marks scaled.
      const textX = four ? -cw / 2 + 40 : -cw / 2 + 42 * k;
      const wrap = { wordWrap: { width: Math.round(four ? cw - 40 - 16 * k : cw - 58 * k) } };
```

### Steps
1. In `buildRow` (`src/scenes/DraftScene.ts`, lines 107–108), replace those two lines with the snippet above (keep the two-line comment or an equivalent one).
2. Verify no other edit is needed: `textX` is consumed only at lines 138–139, `wrap` only at 112–113 (before the height measurement on line 116, so `H` already uses the final wrap width); the glyph calls at lines 141–142 keep `-cw/2 + 26` at full size; the three-card path (`k = 1`) yields the old values exactly (`-cw/2 + 42`, wrap `162`).
3. Check `npm run check` passes.

### Pitfalls
- Gate on `four` — an ungated change would move the three-card text (42 → 40) and break the pixel-for-pixel criterion.
- Do not touch `drawTowerGlyph`/`drawPlusGlyph` or the glyph x: under this option the icons stay full size at `-cw/2 + 26`; their right edge is the 8 px half-width of the plinth (the plus is only 7), which the 40 clears by 6 px.
- The height pass (line 116) needs no change: it reads `towerLine.height`/`addedLine.height` produced with the new wrap, so the card still grows for three-line Beam/Spray text.
- Phone 2x2 wrap is 72 px — that is the accepted trade-off; the card grows in height, and the grid still fits (H ≈ 230 for two three-line rows leaves room in 915 px).

### Tests
- none
