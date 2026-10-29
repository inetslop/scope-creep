---
id: T0225
title: "The tech tree: card text that never overlaps, rows sized from their cards"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T17:00:35Z
---

## Goal
Seen at 1280x720: on the Momentum card the description ("unlocks the Momentum augment in the draft", three lines) rises into the card's name, so the two overlap. Any description that wraps to three lines does the same. Lay each tech card out top-down so its text can never overlap, and size the rows from the cards instead of from fixed numbers.

## Details
- **Why it broke:** in `src/scenes/TechScene.ts` each card's text is hand-placed. The name sits at y -32 and the description is *centered* at y -4, so a longer description grows up into the name as well as down. The cards are a fixed 160x100. The row positions are fixed numbers too (the 73, 112, 50 and 31 in `rebuild()`), so nothing gets taller when a card's text does.
- **Each card as a column, from the top:** the name; below it, with a small gap, the description (top-aligned, so it only grows downward); the price line (or "owned", "needs the previous", "not in the game yet") pinned to the bottom. The same padding at the top and the bottom.
- **The cards in a row are the same height:** the height of the row's tallest content. Each row's y comes from the row above it (its label, then its cards, then a gap), and the panel's height comes from the rows plus the Menu button, with the same padding at the top and the bottom.
- **A name or description never wider than the card minus its padding:** the description wraps; a name that would be too wide shrinks to fit (never below 13 px).
- **The balance row:** the coin icon sits right beside the number (a small fixed gap), as a centered pair.
- **Keep:** the wide (one line of cards per row) and narrow (two columns) layouts, the scroll and down-arrow when the panel is taller than the screen, the owned border (it follows the card's new height), the greyed locked cards, the red price when unaffordable, the buy pop and chime.

## Acceptance criteria
- [ ] At 1280x720 and 412x915, no card's name, description and price line overlap, for every node (Momentum included).
- [ ] The cards in a row share one height, and no text crosses a card's edges.
- [ ] The rows and the Menu button stay evenly spaced, and the panel's top and bottom padding match.
- [ ] The owned border fits the card exactly.
- [ ] Scrolling still works when the panel is taller than the screen.
