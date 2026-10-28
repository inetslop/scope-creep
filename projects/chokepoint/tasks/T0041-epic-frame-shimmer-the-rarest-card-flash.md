---
id: T0041
title: "Epic frame shimmer: the rarest card flashes as it lands"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T10:59:21Z
claimed_at: 2026-10-28T10:59:37Z
epic: E4
designer: yoga
---

## Goal
The draft's rarest moment gets a flash: when an Epic card lands face-up on the reveal flip, its purple frame runs one quick white shimmer, so the rarest card in the offer is noticed before its name is read.

## Details
- On the draft reveal (T0024), when an Epic card's flip lands, a one-shot white shimmer passes across the card from left to right in about 150 ms: a flat white band (the card's own white, soft alpha edges — no glow, no color gradient, no outline) that reads as the purple frame flashing where it crosses. The instant it ends, the card looks exactly like it does today.
- One shimmer per reveal: it plays on the first offer and again when the reroll (T0036) re-flips the offer. It never plays again while the card sits in the draft, and it never plays on hand cards or tower-panel cards.
- Common and Rare cards land exactly as they do today: no shimmer.
- Nothing else changes: the flip's timing, the tier chime (T0032), the gem row, the tier word, the card sizes on 412x915 and 1280x720, and every other scene.
- Closest example: the draft-card flip in `DraftScene.ts` (T0024) — the shimmer starts at the moment that flip lands.

## Acceptance criteria
- [ ] In a draft offer containing an Epic card, that card's reveal flip lands with a one-shot ~150 ms white shimmer passing left to right; the Common and Rare cards in the same offer land without it.
- [ ] The reroll's re-flip shimmers an Epic card once more; a card already in the draft or in the hand never shimmers again.
- [ ] After the shimmer the Epic card looks exactly as it does today (purple frame, gem row, "Name · Epic" line): no glow, gradient, outline, sound, or layout change at 412x915 or 1280x720.
- [ ] Flip timing, tier chime, the hand and tower panel, and every other scene are unchanged; the desktop and mobile smoke tests pass.
