---
id: T0318
title: The first run says pick a card
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T01:13:09Z
epic: E11
---

## Goal
A first-time player is dropped onto three unfamiliar cards and nothing says what they are for; on the device's very first run, the pre-wave-1 draft wears one plain white card — "Pick a card" — until a card is picked. The first of E11's three hints and its smallest end-to-end version: one hint a player can use.

## Details
- First run only: the profile's runsPlayed is still 0. A first run resumed after a tab close is still a first run; the hint re-derives from the run's state (T0272's pattern), so a resumed first run that has already picked a card never shows it.
- Only the opening draft (before wave 1), never a later one. A reroll of the opening draft re-flips the cards under the hint; the hint stays up until a pick.
- Look: the HUD's own white card (the draft cards' language, a size below them): one line of bold ink text, ~14 px, "Pick a card", centered above the row of draft cards.
- One in, one out: first run only, one line, gone by doing, never a permanent mark — the teach's language (T0107's first leak, T0272's early send, T0314's streak), a card instead of a line because it outlives the flip: it sits until a first-timer makes a pick.
- Dismissed by doing: the moment any card is picked the card fades out (~150 ms) and never comes back. No sound, no input — a teach, not a button (nothing to list on the pause screen).
- Untouched: the draft's offers, the flip, the tier chime, the reroll button, the hand, the menu demo.
- Closest example for the build: the teach's guard-and-re-derive pattern from `src/systems/fx/streakTeach.ts` (T0314, fired from its one guarded site), shown here while its condition holds (opening draft open, nothing picked) instead of for a fixed time; the card itself in the look of the HUD's white cards.

## Acceptance criteria
- [ ] On a fresh profile (no finished runs), the opening draft shows the "Pick a card" card above the cards; picking any card fades it out and it never reappears in that run or any later run.
- [ ] It never shows in a later draft of the first run, in any run with runsPlayed ≥ 1, or in a resumed first run that has already picked.
- [ ] A reroll of the opening draft leaves the hint up; the card plays no sound and takes no input.
- [ ] The draft (offers, flip, chime, reroll) behaves exactly as before, and everything still fits at 412x915 and 1280x720 with the card up.
