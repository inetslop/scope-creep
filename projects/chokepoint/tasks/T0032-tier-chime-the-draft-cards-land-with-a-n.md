---
id: T0032
title: "Tier chime: the draft cards land with a note per tier"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T07:16:57Z
claimed_at: 2026-10-28T07:22:27Z
epic: E4
designer: yoga
---

## Goal
The draft reveal already says the tier with the eye (frame, gems, tier word, the Epic's held flip); let it say the tier with the ear: each offered card plays a short chime as it lands face-up, higher and longer the higher the tier, so an Epic reveal lands as a small hit and a first-time player learns the tier order without reading.

## Details
- Where: the existing draft reveal flip (T0024) — at the moment each of the three offered cards lands face-up, that card plays its chime. The three chimes play in flip order with the existing stagger; the Epic card's chime lands a beat later with its held flip.
- Notes by tier (sine, 80 ms per note):
  - Common: one note — C5 (523 Hz).
  - Rare: two notes — C5 (523), then E5 (659).
  - Epic: three notes — C5 (523), E5 (659), G5 (784).
- Volume: the same soft class as the existing UI blips — never louder than the hit blip. Closest example: `src/audio/Sfx.ts` — add one new method next to `kill()` (the hit blip) and schedule the notes with the existing `tone()`; second closest example for quietness: the leak-warning tick (T0014). Three cards in a row must still sound like a calm reveal, not a fanfare: no extra hits, no swells.
- Files: `src/audio/Sfx.ts` (one new method) and the draft scene that plays the reveal flip (T0024 — confirm the file name when you start). No other files.
- No new input, no new HUD element, no change to the flip animation, its stagger, the Epic's held flip, or the card's look.

## Acceptance criteria
- [ ] In a build phase, opening the draft: each of the three offered cards plays a short chime as it lands face-up, in flip order (the Epic's chime lands a beat later with its held flip).
- [ ] The tiers sound different and ordered: Common is one low note, Rare is two notes with a higher top note, Epic is three notes with the highest top note — a player hears which card is the Epic.
- [ ] The chime is never louder than the other UI blips; three cards revealing in a row still sounds calm.
- [ ] The flip animation, its stagger, the Epic hold and the cards' look are unchanged; no new key, button or HUD element.
