---
id: T0026
title: "The draft card says its tier: · Rare and · Epic on the name line"
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: [T0024]
attempts: 1
created: 2026-10-28T05:31:15Z
claimed_at: 2026-10-28T05:57:35Z
epic: E4
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

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` — the card's name line reads "Name" (Common, as today) or "Name · Rare" / "Name · Epic" (Rare/Epic). One text string changes; nothing else moves.

### Interfaces
None. No types, exports or signatures change; `titleStyle(20)` keeps the name's style (ink, bold, 20 px, from `src/ui/text.ts`).

### Steps
1. In `DraftScene.create()`, in the `offered.map` loop, replace the name line at `src/scenes/DraftScene.ts:66`:
   - from: `const name = this.add.text(0, -37, b.name, titleStyle(20)).setOrigin(0.5);`
   - to:
     ```ts
     // Rare and Epic say their tier on the name line; Common keeps the plain name, like its plain frame.
     const nameText = copy.tier === 'common' ? b.name : `${b.name} · ${copy.tier.charAt(0).toUpperCase() + copy.tier.slice(1)}`;
     const name = this.add.text(0, -37, nameText, titleStyle(20)).setOrigin(0.5);
     ```
   The middle dot is `·` (U+00B7, same as the odds line at `DraftScene.ts:59`). This mirrors the tower panel's "Name · Tier" (T0008): the tier word is ink, the tier color stays on the frame (`DraftScene.ts:82-85`) and the gem row (`DraftScene.ts:67-71`).
2. If `src/ui/tierLook.ts` has landed by the time you work on this (T0008 adds a tier-name helper for the hand and panel), build `nameText` with that helper instead of the local capitalization; read its export to confirm the exact name. It does not exist today, so the local version is the plan.
3. Nothing else: no icon, frame, gem row, odds line, `towerLine`, `addedLine` or `key` changes; the card stays `CARD_W` 220 × `CARD_H` 206.

### Pitfalls
- The name text is centered (`setOrigin(0.5)` at x 0), so the longer string grows symmetrically — no element reflow. Longest is "Splash · Epic", ~120 px in 20 px bold, well inside the 220 px card at 412×915 and 1280×720. Do not add `setAlignment` or a width: `titleStyle(20)` must stay untouched (same size/weight/ink).
- T0024's flip lands in the same file (same cards loop) — re-read `DraftScene.ts` when you start; the name text must live on the face-up card only. Never add a name or tier word to the face-down back (blank white card, one muted-gray gem); while face-down nothing of the name is visible because the back has no name element at all.
- T0008's "Name · Tier" example is not in the code yet (narcissus, still todo) — do not wait for it and do not create `src/ui/tierLook.ts` yourself.

### Tests
- none (UI string change, no core rule).
