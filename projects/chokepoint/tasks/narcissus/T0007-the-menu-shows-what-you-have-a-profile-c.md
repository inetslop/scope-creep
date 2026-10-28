---
id: T0007
title: "The menu shows what you have: a profile card"
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T02:32:29Z
epic: E1
designer: desktop
---

## Goal
The menu shows your profile at a glance: coins, best wave, runs played, and your last result.

## Details
- A new white rounded card on the menu, placed between the title and the start button (the live demo keeps running behind everything, as today):
  - a row: a yellow coin icon (rounded circle, ~24px) and the total coins in large bold type
  - a line: "Best wave 14"
  - a line: "Runs 32"
  - a line in gray, only after at least one finished run: "Last: wave 9 · +17 coins"
- Values come from the saved profile (T0001). Before any run: coin total 0, "Best wave 0", "Runs 0", no Last line.
- Layout: at 412x915 the card sits between title and start button and must not cover the button; at 1280x720 it sits centered above (or beside) the start button.

## Acceptance criteria
- [ ] After a finished run, the menu shows the updated coin total, best wave and runs count, and the Last line.
- [ ] On a fresh device (no saved profile) the card shows 0 coins, "Best wave 0", "Runs 0" and no Last line.
- [ ] The card does not overlap the start button or the title at 412x915 or 1280x720.
- [ ] Starting a run from this menu state works as before.
