---
id: T0274
title: "Sell: the panel's line that sells a misplaced tower back"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T09:46:01Z
claimed_at: 2026-10-30T11:39:41Z
epic: E7
design_attempts: 1
designer: baby-mama
---

## Goal
A mistake can be fixed mid-run (E7): in the build phase the tower panel wears a "Sell · +N" line that lifts the tower out and pays 70% of what its slots cost — a misplaced tower is not permanent, and selling costs 30% of the tower, so it is a fix, not a free repick. (Re-file of T0263, whose failure was an architect context overflow before any design; the line stands as written, tightened below.)

## Details
- **The line (the tower panel, the buy-slot line's own pattern — read that line first):** while a tower is selected **in the build phase**, the panel wears a bottom line, "Sell · +N": N is 70% of what the tower's slots cost, floored — the same slot prices the buy-slot line pays. No line in the wave phase or the draft. The line is always active while shown (selling pays gold; it never runs short).
- **The sell:** tap the line and the tower lifts out of the board with a short rise-and-fade (~200 ms, the drop-in bounce's tempo, T0022's board juice), its cell frees, and the gold pays at the plinth: the gold pop (T0039's shape) and one coin sliding to the stats card's gold number (T0061's trail). The augments are gone — selling is a refund, not a retrieve; nothing returns to the hand. The panel closes (no tower left to select).
- **Supports stop working the same frame:** a sold Rally stops speeding its neighbors, a sold Anchor stops rooting, a sold Mint stops paying, a sold Toll stops collecting — the auras read the towers standing, and a sold tower is gone from them.
- **The books:** the run's gold grows by N (the stats card's gold number reacts as on any gold gain; the run's coin tally is untouched — selling is neither a wave nor a kill). The tower's kills stay in the run's totals (the score's stopped count, the combo history) and the end card's by-tower list shows only towers standing at run end — a sold tower is not in it (T0216).
- **The pause screen (Pillar 8):** the controls line gains "Sell — the panel's line, build phase only", listed like the other build actions (T0245's tidy column absorbs it).
- **Resume:** a sell is part of the current build phase, like a placement; the run's phase-boundary save already covers it — a sell before the wave starts is in the wave-phase save, and a sell after the tab closed is undone on resume, exactly like an unsaved placement.
- **What it is for:** the sunk-cost habit — a tower placed beside the wrong bend costs 30% of its slots to move on from, and its augments do not come back, so selling is the last resort, not the plan.

## Acceptance criteria
- [ ] In the build phase, a selected tower's panel wears a bottom line "Sell · +N" with N = 70% of its slots' cost, floored (a fresh one-slot tower sells for 70% of the first slot's price); the line is absent in the wave phase and in the draft.
- [ ] Tapping it lifts the tower out, frees its cell (buildable again in the same phase), and pays N gold: the gold pop at the plinth, one coin sliding to the stats card's gold number, the gold number growing by N, the coin tally unchanged.
- [ ] The tower's augments do not return to the hand and the panel closes.
- [ ] A sold support stops working immediately: a sold Rally's neighbors attack at their own rate the same frame, a sold Mint pays nothing on the next kill, a sold Toll collects nothing on the next leak.
- [ ] The tower's kills stay in the run totals; the end card's by-tower list omits the sold tower.
- [ ] The pause screen's controls line lists the sell; the pause card with the new line fits at 412x915 and 1280x720.
- [ ] A sell during the build phase survives to the wave (it is in the wave-phase save) and is undone on resume from the build-phase save, like an unsaved placement.
