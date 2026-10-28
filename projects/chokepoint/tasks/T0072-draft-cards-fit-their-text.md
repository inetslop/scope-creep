---
id: T0072
title: Draft cards fit their text
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T17:31:39Z
claimed_at: 2026-10-28T17:32:00Z
designer: yoga
---

## Goal
Every draft card shows all of its text inside the card, with room to spare. Today the long cards spill: Anchor's added line ("Hits root for 0.5s (+0.25s per extra Anchor).") ends right on the card's bottom edge, and the card covers the "Reroll" button under it. Rally's text is longer still.

## Details
- The draft card is a fixed 220x206 (`CARD_H` in `scenes/DraftScene.ts`), and its two text lines start at the card's middle, so about 100 px are left for both lines. Two 3-line lines at 14 px do not fit.
- Fix it so the card always holds its text: for example, the card grows taller to fit its lines, all three cards in the offer take the tallest one's height so the row stays even, and the layout places the cards and the reroll button from that real height instead of the fixed `CARD_H`. Moving the text up a little, if the name and gem leave room, is fine too. Do not shrink the text below 14 px, and keep the card's look (white rounded card, tier frame, glyphs, key hint, owned dot).
- The longest cards today: Rally (both lines about 60 characters each, every tier), then Anchor (every tier) and Ember. The fix must hold for any augment's text, not just these.
- The reroll button keeps at least 16 px of clear space below the cards in both layouts.
- Both layouts: three cards in a row (1280x720), and three cards stacked (412x915). On a phone, the stacked cards with the reroll button must still fit on screen; if taller cards would push the reroll button off a 915 px tall screen, tighten the gaps instead.

## Acceptance criteria
- [ ] Rally, Anchor and Ember cards at every tier show all of their text inside the card, with at least 12 px between the last line and the card's bottom edge, at 1280x720 and 412x915.
- [ ] The three cards of an offer have the same height.
- [ ] The reroll button never overlaps a card, with at least 16 px between them, in both layouts.
- [ ] At 412x915, all three cards and the reroll button are fully on screen.
- [ ] Short cards (Bolt, Rapid) still look balanced: no big empty area at the bottom of the card when the offer's text is short.
- [ ] The flip reveal, the Epic shimmer, the tier frames and the key hints work as before.
