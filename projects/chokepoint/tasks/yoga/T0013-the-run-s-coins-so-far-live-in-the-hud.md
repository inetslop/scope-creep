---
id: T0013
title: "The run's coins so far, live in the HUD"
assignee: yoga
size: S
priority: 2
status: designing
depends_on: [T0001]
attempts: 0
created: 2026-10-28T02:08:37Z
claimed_at: 2026-10-28T02:08:47Z
epic: E1
designer: yoga
---

## Goal
The player sees the run paying out as it happens: the HUD shows this run's coin tally so far, ending at exactly the number the game-over card prints.

## Details
- In the HUD card that shows the run state (gold and lives — closest example: the existing gold readout in the HUD), one new line: a small yellow coin icon (~12 px, the same rounded-circle coin icon the profile card uses, T0007) and "+N coins" in muted gray, placed with the other run-state lines.
- N uses the EXACT same rule as the game-over card (T0001): waves cleared + floor(enemies stopped / 10) + clean waves. It updates when a wave is cleared and when an enemy dies — the number simply changes, no tween, no sound.
- It must read as different from the spendable gold: smaller, gray, prefixed with "+". A fresh run starts at "+0 coins".
- Layout: the line fits the card at 412x915 and 1280x720 without covering any existing line or pushing the card off screen; if the card must grow, every existing line stays visible at both sizes.
- No new inputs, no pause-screen change (it is a readout, not a control).

## Acceptance criteria
- [ ] During a run the HUD number grows as enemies die and waves clear, and the final game-over "+N coins" line equals the last number the HUD showed.
- [ ] A fresh run starts at "+0 coins"; a run with nothing earned yet stays at "+0 coins" with no pop and no sound.
- [ ] The line is visibly smaller and grayer than the gold readout — a first-time player can tell spendable gold from run coins at a glance at both sizes.
- [ ] The HUD card with the new line fits at 412x915 and 1280x720 with no overlap.
