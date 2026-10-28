---
id: T0026
title: "The draft card says its tier: · Rare and · Epic on the name line"
assignee: yoga
size: S
priority: 3
status: designing
depends_on: [T0024]
attempts: 0
created: 2026-10-28T05:31:15Z
claimed_at: 2026-10-28T05:40:17Z
epic: E4
designer: yoga
---

## Goal
A first-time player can read a card's rarity without decoding gems: Rare and Epic draft cards say so on the card itself, with the same "Name · Tier" line the tower panel uses.

## Details
- One file: the draft scene (`src/scenes/DraftScene.ts` — the same file T0024's card flip edits). The card's name line (the bold augment name near the top of each card, the one T0002's card content builds and T0024 turns face-up) becomes:
  - Common: unchanged — the plain name in ink. Common stays the default, like its plain frame.
  - Rare: "Name · Rare" (e.g. "Rapid · Rare").
  - Epic: "Name · Epic".
- One text element, same font, size, weight and ink color as the name has today. Closest example: the tower panel's "Name · Tier" line (T0008) — the tier word is ink, not tier-colored; the color stays on the frame and the gem row.
- No reflow: the card's icon, frame, gem row, odds line and both text lines keep their T0002 positions and sizes; the longest line ("Rapid · Epic") fits the card width at 412x915 and 1280x720. No other card element moves or resizes.
- The face-down back from T0024 (blank white card, one muted-gray gem) stays exactly as it is — no name while face-down.
- If T0008's shared tier look helper has landed in `src/ui/` (it adds a tier-name helper for the hand and panel), use it for the name; otherwise capitalize the tier word locally.
- No new input, no new sound, no pause-screen change, no hand or tower-panel change (the panel already shows the line).

## Acceptance criteria
- [ ] A Rare card's name line reads "Name · Rare" and an Epic card's reads "Name · Epic", in the same style as the name has today (ink, bold, same size).
- [ ] A Common card's name line is exactly as it is today.
- [ ] Everything else on the card — icon, frame, gem row, odds line, first and added text lines — is unchanged at 412x915 and 1280x720.
- [ ] While a card is still face-down (before its flip finishes) no name or tier word is visible.
