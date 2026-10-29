---
id: T0097
title: The tier word wears its tier
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
epic: E4
---

## Goal
Rarity is read before the name is finished: on the draft cards the tier word (T0026) is drawn in the tier's own color — the same blue and purple the frame and gems already use.

## Details
- On a draft card, the "· Rare" / "· Epic" word on the name line (T0026) is drawn in the tier's own color: blue for Rare, purple for Epic — the exact colors of that tier's frame and gem row (T0002) and of the tower's slot pips (T0010). Common cards are unchanged: plain name, no word.
- The word keeps T0026's style and position (the name line's bold name style); only its ink changes per tier. The card's size and text fit (T0072) are untouched — this is a color change, not a layout change.
- Draft cards only: the hand cards and the tower-panel cards are not touched by this task (the hand's own word is T0100).
- No new line, no input, no sound, no rule change.
- Closest examples: the draft card's tier word (T0026) for the text and placement; the frame/gem/pip tier colors (T0002, T0010) for the blue and purple.

## Acceptance criteria
- [ ] A Rare draft card reads "Name · Rare" with "· Rare" in blue (the Rare frame's blue); an Epic card reads "· Epic" in purple (the Epic frame's purple); a Common card shows the plain name with no word.
- [ ] The word's size, weight and position are exactly T0026's — only its color differs by tier.
- [ ] A Common card renders byte-identically to today; the card's growth and text fit (T0072) are unchanged.
- [ ] The hand cards and the tower panel are untouched by this task; desktop 1280x720 and mobile 412x915 smoke pass.
