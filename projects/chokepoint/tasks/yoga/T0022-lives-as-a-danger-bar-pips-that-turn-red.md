---
id: T0022
title: "Lives as a danger bar: pips that turn red and pulse on your last life"
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T04:43:01Z
claimed_at: 2026-10-28T05:03:09Z
designer: desktop
---

## Goal
The lives readout reads at a glance: exactly how many lives are left, and whether the next leak ends the run.

## Details
- In the HUD stats card (the white card in the Hud scene that T0013 grew with the "+N coins" line), on the existing lives line, next to the lives number, add a small row of pips:
  - One pip per life at the start of the run: a small rounded chip about 8 px tall, in the same color the lives number uses today (if that color is already red, use orange for the safe pips instead).
  - A lost life is a gray slot: the same chip in the muted gray the coin-tally text uses.
  - When one life or fewer remains, the remaining pips turn red and pulse gently — the same red and the same slow ~1 s rhythm as the leak warning on the exit (T0014, `src/systems/ExitWarning.ts`).
- The pips sit on the existing lives line; the card keeps the size T0013 set (no growth, no reflow of the gold or coin lines).
- No new input, no new button: the pips are a readout on an existing card, shown exactly where the lives number is used; the pause screen is unchanged.

## Acceptance criteria
- [ ] The HUD stats card shows a row of life pips next to the lives number — one per starting life; losing a life turns its pip into a gray slot.
- [ ] With one life or fewer, the remaining pips are red and pulse on a ~1 s cycle matching the leak warning's red.
- [ ] With more than one life, the pips use the safe color and do not pulse.
- [ ] The card keeps T0013's size and fits at 412x915 and 1280x720 with no overlap.
