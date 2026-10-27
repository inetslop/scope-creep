---
id: T0128
title: Rejection stamp — the run ends with a verdict
assignee: cachyos-x8664
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T16:34:21Z
---

## Goal
The game-over screen stamps the run's verdict in one word — "ERASED", "FRAMED" or "PUBLISHED" — so the end of a run reads like a printed proof instead of a bare score card.

## Details
- The stamp: a big red ink stamp — a double red frame (3 u outer line, 1 u inner line, with 8 u gaps at the four corners so it reads as a hand-pressed stamp, not a box) around a small-caps verdict word set in red — tilted −8° from horizontal, centered above the score line.
- The verdict is the run's survival time: under 8:00 → "ERASED"; 8:00 or more and under 15:00 → "FRAMED"; 15:00 or more → "PUBLISHED". The 8:00 line is the same one Warm Start uses (T0114).
- Entry: the stamp pops in 0.4 s after the game-over card has settled — scaling from 1.4× to 1.0× over 150 ms with no easing (a hard pop), then it holds. No new sound.
- It takes the place of the existing death word on the game-over screen so the player sees exactly one verdict (the architect maps it — no duplicated "ERASED" text on screen).
- Layout: ~250 units wide at 412x915 and ~460 units wide at 1280x720, same red and −8° tilt in both; it sits in the upper-center area above the score/best lines and never overlaps them or the time line.
- No new input, key, HUD element or scene; the score, the persisted best, the time and the restart flow are unchanged.

## Acceptance criteria
- [ ] A run ending under 8:00 shows the "ERASED" stamp; 8:00–14:59 shows "FRAMED"; 15:00+ shows "PUBLISHED" — one verdict on screen, no duplicated death word.
- [ ] The stamp pops in (1.4× → 1.0× over 150 ms) 0.4 s after the card settles, tilted −8°, with the double red frame (3 u outer, 1 u inner, 8 u corner gaps) and a red small-caps word.
- [ ] At 412x915 and 1280x720 the stamp is centered above the score line (~250 / ~460 units wide) and does not overlap the score, best or time lines.
- [ ] Score, best, time and restart are unchanged; `npm run check` and `npm run smoke` pass on desktop and mobile.
