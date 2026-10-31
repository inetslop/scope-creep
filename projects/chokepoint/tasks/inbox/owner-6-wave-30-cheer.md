---
title: Wave 30 cheers, and offers to claim now or keep going
size: M
priority: 1
depends_on: [T0325]
epic: E9
---

## Goal
The owner's call: reaching wave 30 is the game's big milestone (it unlocks the next level), so the game says so. When wave 30 is cleared, a card congratulates the player and asks: end the run now, claim the rewards and go on to the next level, or keep going?

## Details
- **When:** right after wave 30 is cleared, before the draft opens. Once per run: a resumed run past wave 30 never asks again (record it in the run save; older saves count as asked once their wave is past 30).
- **The card** (an overlay scene, a white card on the shade, like the pause):
  - Title "Wave 30!".
  - One line: when this run unlocks the next level (its level = the profile's slots and the slots are below the set size): "Level n+1 is yours. Claim now to play it." Otherwise: "30 waves held."
  - Two buttons: **Claim rewards** ends the run with its rewards, through the same deliberate end as the pause's Quit run (the `RunFlow` method from T0325; the end card titled "Run ended"), and **Keep going** closes the card and the draft opens as usual. Keep going is the default (Enter or Space); Claim has its own key (C). Key hints on both.
  - The tier chime (or the existing milestone sound) plays when it opens.
- **Keeping going never loses the unlock:** the slot is earned by reaching wave 30 (`levelSlotsAfter`, unchanged), whenever the run then ends.
- Every mode (normal, Iron, ghost) and every level.
- ?smoke: the card picks Keep going on its own.

## Acceptance criteria
- [ ] Clearing wave 30 opens the card once; a resumed run past wave 30 doesn't open it.
- [ ] The line names the next level only when this run unlocks it.
- [ ] Claim rewards opens the end card titled "Run ended" with this run's coins; the menu then has no Resume.
- [ ] Keep going opens the draft, and the run goes on as before.
- [ ] Works with mouse, keys (Enter/Space, C) and touch at 1280×720 and 412×915.
