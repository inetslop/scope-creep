---
id: T0413
title: "The pause line says which run it is: a muted mode word on the run line"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T08:58:13Z
claimed_at: 2026-11-02T08:59:01Z
designer: yoga
---

## Goal
A player who pauses — or resumes the next day — sees which mode the run is in: the pause card's run line wears a muted word for the run's mode, so an Iron run (double coins, no last stand) is recognized where the run is read, not only on the claim card.

## Details
- The pause card's run-so-far line ("Wave N · X lives · Y gold · +Z coins") gains one muted word after the wave number while an Iron run is on: "Wave N · iron · X lives · …" — the muted ink the profile's "Iron wave N" line and the "held · N" chip use, the line's own size and weight.
- A normal run's line is byte-identical to today (no word, no extra space); the line still reads "Ready" before wave 1, with no word.
- No new card, button, key or sound; the line keeps fitting its card at 412x915 and 1280x720 with the longest numbers.

## Acceptance criteria
- [ ] In an Iron run the pause card's run line reads "Wave N · iron · X lives · Y gold · +Z coins"; in a normal run it reads exactly today's line.
- [ ] The word is muted (the "held · N" chip's ink), the line's own size, and the pause card's fit is unchanged at 412x915 and 1280x720.
- [ ] Before the first wave the line reads "Ready" with no mode word; every other pause line, the keys and the sound are untouched.
