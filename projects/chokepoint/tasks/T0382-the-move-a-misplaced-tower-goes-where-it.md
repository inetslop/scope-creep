---
id: T0382
title: "The move: a misplaced tower goes where it should"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T21:57:55Z
claimed_at: 2026-11-01T21:57:59Z
epic: E15
designer: cachyos-x8664
---

## Goal
A misplaced tower is not permanent, and it doesn't have to be sold: during the build phase the player can move a tower to a free build cell for a fee, keeping its augments and kills — so repositioning against the wave preview is a decision with a real price, not a free reposition or a sell-and-rebuild.

## Details
- **The line.** The tower panel (open on a selected tower, build phase only) wears one new line beside the existing Sell line: **Move · −N**, where N = 60% of the tower's total slot cost, floored, minimum 5 gold — the same slot total and rounding the sell prices from (the sellPrice's own rule, core/techEffects.ts). A one-slot tower moves for 5, so a move is never free.
- **Gold short.** While the run's gold is below N the line dims and the −N reads red (the buy-slot button's own language); tapping it does nothing.
- **The move state.** Tapping Move · −N (with enough gold) opens the move state, build phase only: the selected tower dims to 50% alpha (the out-of-reach boss's own dim), every free build cell wears the placement preview's own outline, and any selected hand card is cleared (the what-if markers clear). A tap on a free cell previews the move there: the tower's own range ring at that cell with the placement's own ✓/✗ buttons. A tap on a non-free cell (road, rock, an occupied cell), or a second tap on the Move line, exits the move state — the tower returns to full alpha, nothing is spent.
- **The commit.** ✓ pays the fee and moves the tower: a small white chip with the HUD's ~10 px coin icon and a bold "−N" in muted ink pops at the old cell (the Hauler leak's −5 chip's own look); the tower slides from the old cell to the new one over ~300 ms (straight, ease-out) and lands with the build's own drop-in bounce; the place haptic plays on landing. The tower keeps everything that is on it: augments, tier pips, kills line, DPS line, targeting mode, and its quiet-dot state.
- **The limit.** One move per tower per build phase. After the commit the line reads **Moved** (muted, no number) until the next build phase opens, when it re-enables with the current fee. The moved flag rides the resume save, so a resumed build phase keeps the "Moved" line.
- **The teach.** In the run's first build phase (wavesCleared 0, the early-send teach's own condition) one muted line sits under the Move line: "keeps its augments and kills" — once per run.
- **The controls list.** The pause card's controls list gains one line naming the move (a tower's panel line, then a free build cell), the way its listed build-phase actions read.
- If the wave starts while the move state is open (the big button or the countdown), the state clears: the tower stays where it stood, nothing is spent.
- No new permanent marks on the board: the move state reuses the placement preview's outline, ring and confirm buttons; nothing new stays on the screen after the state closes.

## Acceptance criteria
- [ ] In the build phase, a selected tower's panel shows "Move · −N" beside the Sell line: N = 60% of the tower's slot cost, floored, minimum 5; a one-slot tower reads Move · −5.
- [ ] While gold < N the line is dimmed with a red −N and tapping it does nothing; with enough gold it taps into the move state (tower at 50% alpha, free cells outlined, any held hand card cleared).
- [ ] In the move state a tapped free cell shows the tower's range ring with the ✓/✗ buttons; ✓ spends the fee, pops the −N chip at the old cell, slides the tower over ~300 ms into the drop-in bounce with the place haptic, and the tower's augments, tier pips, kills, DPS line and targeting mode are unchanged.
- [ ] ✗, a tap on a non-free cell, or a second tap on the Move line cancels the state with no gold spent; starting the wave while in the state clears it the same way.
- [ ] After one move the line reads "Moved" (muted) for the rest of the build phase, re-enables in the next one, and the limit survives a resume.
- [ ] The first build phase of a run shows the one-time muted "keeps its augments and kills" line under Move; the pause card's controls list names the move.
- [ ] The panel with the longest fee number fits its card at 412x915 and 1280x720 (the layout check in the gate).
