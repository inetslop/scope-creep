---
id: T0016
title: "A \"Best\" star on the profile card"
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T03:39:38Z
epic: E1
---

## Goal
When the run you just finished reached your best wave, the menu should make that obvious: a small celebration mark on the profile card.

## Details
- The profile card (the white card on the menu, added by T0007) already shows a "Best wave N" line and a "Last: wave N · +N coins" line. When the player's most recent finished run reached the current best wave, add a small yellow star immediately to the right of the "Best wave N" text, on the same line.
- The star is a small yellow five-point star, about the height of the "Best wave" text. It is the only new thing on the card.
- The condition is: the last finished run's wave equals the best wave the card already shows. The card already reads both values from the saved profile, so no new data is needed — this is display only.
- A fresh profile (no finished runs) shows no star.
- The star does not change the card's size or any other line; it sits on the existing "Best wave N" line.
- It must fit the card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Finish a run whose wave equals your best wave; the profile card shows a small yellow star to the right of the "Best wave N" line.
- [ ] Finish a run that does not reach your best wave; no star is shown.
- [ ] A fresh profile (no runs) shows no star.
- [ ] The card's size and its other lines are unchanged; the star fits at 412x915 and 1280x720.
