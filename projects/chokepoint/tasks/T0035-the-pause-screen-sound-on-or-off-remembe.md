---
id: T0035
title: "The pause screen: sound on or off, remembered"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T08:43:02Z
epic: E1
---

## Goal
A player who wants the game quiet (or back on) can say so from the pause screen, and the choice sticks — the profile (E1) now keeps one more preference, across reloads and sessions.

## Details
- One new row at the bottom of the pause card, below the Quit button, in the card's white rounded look: a small chunky speaker glyph (rounded square with a triangle, no outline dressing), the word "Sound", and the state word — "On" in ink, "Off" in muted gray. Glyph and text are ink when On, muted gray when Off. The whole row is the target: one click or tap anywhere on the row toggles it (large touch target, no separate mini-button).
- Off silences every sound in the game: hits, kills, pops, the tier chime, the coin chime, the leak warning, UI blips — nothing plays. On plays everything exactly as today. (There is no music yet, so "all sound" is all of it.)
- Toggling to "On" plays one soft UI blip (the same soft volume class as the draft blips) so the player hears the switch work; toggling to "Off" is silent.
- The choice is kept in the profile as a new field (default: on, for a fresh profile), saved the moment it is toggled, and read at boot so a page reload — and the next session — keep it.
- No new key; the row is a mouse-and-touch button. No new sound effect beyond reusing the existing soft blip.
- Closest examples: the pause card's own buttons for the row's look and size, and the HUD coin line's On/Off-style state text (T0013) for a small muted-vs-ink state.

## Acceptance criteria
- [ ] The pause screen shows a "Sound" row (speaker glyph, word, On/Off state) at the bottom of the card; clicking or tapping it flips the state in place.
- [ ] With the row on "Off", no sound plays anywhere in the game (kills, hits, draft chime, coin chime, leak warning, UI clicks); with "On", everything plays as before.
- [ ] Toggling to "On" plays one soft blip; toggling to "Off" plays nothing.
- [ ] The choice survives a full page reload: set "Off", reload the page, pause — the row reads "Off" and the game stays silent.
- [ ] A fresh profile (no saved data) starts at "On".
- [ ] The row fits the pause card at 412x915 and 1280x720 without overlap or wrapping, in the card's existing white rounded style.
