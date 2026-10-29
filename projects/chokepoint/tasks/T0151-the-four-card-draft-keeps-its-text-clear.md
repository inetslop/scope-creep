---
id: T0151
title: "The four-card draft: the card lines clear their icons"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-29T10:13:21Z
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
