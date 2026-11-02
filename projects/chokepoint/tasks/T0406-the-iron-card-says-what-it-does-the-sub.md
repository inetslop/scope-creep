---
id: T0406
title: "The Iron card says what it does: the sub-line under the name"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T05:03:59Z
claimed_at: 2026-11-02T05:04:12Z
designer: yoga
---

## Goal
The Iron mode's rules are only known to players who have read a run's claim card; the menu's Iron card now says what it buys and what it turns off, in the sub-line language E17's Storm card (T0403) will copy.

## Details
- The Iron card on the menu (the mode card under Play, the same row of cards T0403's Storm card will join — the menu scene; closest example: the profile card's muted line, "runs N · avg wave M", in src/scenes/menu/ProfileCard.ts): one muted line under the card's name, always shown, in the profile card's muted line's own size and color: "1 life · 2× coins · no last stand".
- The card grows to fit the line (its own text-fit pass); the line fits at 412x915 and 1280x720.
- The Play card and every other menu element are unchanged; the claim card's "Iron" read and the pause screen are unchanged.

## Acceptance criteria
- [ ] The menu's Iron card shows the muted sub-line "1 life · 2× coins · no last stand" under its name, in both layouts.
- [ ] The line shows on the menu only — the claim card, the pause screen and the profile card are unchanged.
- [ ] The Play card, the Tech button and the menu demo are unchanged.
