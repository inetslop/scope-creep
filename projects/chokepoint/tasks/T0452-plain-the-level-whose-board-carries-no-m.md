---
id: T0452
title: "Plain: the level whose board carries no marked cell or choke"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T23:41:13Z
claimed_at: 2026-11-03T00:02:08Z
epic: E21
designer: inet-racing
---

## Goal
The run-setup step's level set (Tough, Lean, Short fuse, Swift, Crowded, Blind) gains a seventh level, Plain: a run whose board carries no marked cell and no guaranteed choke — the board's face is plain, the cover is the player's to find, and the run's coin multiplier pays for the handicap. E21's second level: the board's-face dimension.

## Details
- Plain joins the level set on the set's own terms: the same slots on the run-setup step, the same multiplier stack, the same white chip (name only) on the LevelChips row while it is on; the step's chip row self-scales as it does with six levels (no new layout code).
- Plain's multiplier: the set's next notch — bonus 0.40, label ×1.40 (Blind is 0.35; the set's step is 0.05). No new readout: the menu's number before the run, the coin tally and the pause's worth line already carry the multiplier.
- Plain's one-liner on the run-setup step, in the set's dry voice: "no marked cell, no guaranteed choke."
- The board's face: a Plain run's board grows without the marked cell — neither the first mark nor the double mark's second cell — and without the guaranteed choke (the double-cover cell every other board is promised). The rest of the board is exactly as today: the road, the cells, the rocks and the board's shape modifiers (the fork, the loop, the cove, the twin, the far gate, the switchback's corridor, the slow stretch) all stand, and the board always grows a fully playable road — the guarantee is a quality promise, not a road feature.
- The suppression reads the run's level the way the other levels' effects do: the level is on the run before the board grows and back from the run save, so a resumed Plain run regrows the same plain board from its seed (nothing new in the run save).
- What Plain does not touch: the scorch cell (E19's kill mark is earned, not placed — it still works on a Plain board); the marked cell's tech node (The rich cell still buys the 1.5×; on a Plain run there is no cell to buff it, which the level's one-liner already explains); the panel's marked line and the marked cell's first-build chip (with no cell, neither has anything to say — they stay silent, no change to them). The marked cell's buff node (T0386, The rich cell) may land around the same time: it changes the buff's number, Plain changes the cell's presence — keep Plain to presence only, the two coexist.
- The board facts name the absence in the facts' own dry line (the cove and the twin's pattern), so a player who sees a plain board knows the level did it.
- No new teach, mark, HUD element, key or sound: the level chip, the one-liner and the facts line are the whole readout.
- A run without Plain is byte-identical: the marked cell, the guaranteed choke, the double mark and the coin multiplier are all as they are.

## Acceptance criteria
- [ ] The run-setup step lists Plain next to the six, with its one-liner, and a run can start with it; the chip row still fits 412x915 and 1280x720.
- [ ] A Plain run's board has no marked cell (no mark on the ground, no "marked · +N% damage" panel line, no first-build marked chip), no double mark's second cell, and no guaranteed choke cell.
- [ ] A Plain run's board otherwise stands: the road, the cells, the rocks and the shape modifiers (fork, loop, cove, twin, far gate, switchback) generate as today, and the board is a playable road.
- [ ] The board facts name the absence on a Plain run's board in the facts' dry line.
- [ ] Plain's multiplier is ×1.40, the next notch on the set's own scale; it shows on the menu's number before the run and rides on the coin tally and the pause's worth line, with no new readout.
- [ ] A resumed Plain run is still Plain, and its board regrows from the seed without a marked cell or a guaranteed choke.
- [ ] The LevelChips row shows Plain's chip (name only) while it is on.
- [ ] A run without Plain is byte-identical: the marked cell, the guaranteed choke, the double mark and the coin multiplier are unchanged.
