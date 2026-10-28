---
id: T0003
title: "The rewards screen: the moment you claim what a run earned"
assignee: desktop
size: L
priority: 1
status: design
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
A run ends with a satisfying claim moment: after game over, the player opens a dedicated rewards screen that counts up what the run earned.

## Details
- The game-over card gains a new primary button "Claim rewards" (same visual weight as the existing restart button, placed first). The existing buttons stay.
- A new Rewards scene: the board behind is dimmed; one large white rounded card centered:
  - "Waves held" — the number counts up from 0 to the final value over ~0.6s
  - "Stopped" — counts up the same way, starting when the first does
  - a coin line: a yellow coin icon (rounded circle) and the coins-earned number counting up over ~1s, ending on the final value
  - a "Menu" button below
- The scene reads the stored run result from T0001's ledger; it never recomputes anything.
- No new keys; the Menu button (click or tap) is the only input and returns to the menu.

## Acceptance criteria
- [ ] From the game-over card, "Claim rewards" opens the rewards scene; "Menu" returns to the main menu with the profile updated.
- [ ] The three numbers match the game-over card lines exactly (waves held, stopped, +N coins).
- [ ] The numbers count up (not instant): mid-count the value is visibly lower.
- [ ] The card is centered and fully visible at 412x915 (portrait) and 1280x720; nothing overlaps the card.
- [ ] Restarting from the rewards scene is still possible via Menu → start.
