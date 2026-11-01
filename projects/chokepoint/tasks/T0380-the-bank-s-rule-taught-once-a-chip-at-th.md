---
id: T0380
title: "The bank's rule, taught once: a chip at the first interest pay"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T21:18:04Z
---

## Goal
The "bank +N" line (T0374) shows the number without the rule. When the run's first interest pay actually pays, one muted chip names the rule at the stats card's gold number — the run's newest economy readout is explained where it is used (Pillar 8), once per run, never again.

## Details
- **When:** the moment the run's first wave-start interest pay of at least 1 gold lands (the countdown ending and the big button's early send both count — whichever pays first). A pay of 0 (gold under 20, the floor) shows nothing; the chip waits for the first pay that pays.
- **What:** one small white rounded chip in muted ink (the first-leak chip's look, T0107/T0307/T0349), two short lines so it fits beside the stats card at 412×915 and 1280×720: line 1 "bank: 5% of the gold", line 2 "at every wave start · up to +10". It pops at the stats card's gold number, holds ~1.5 s, fades; no sound, no input, no mark left.
- **Once per run:** a run flag set the moment the chip plays (the T0368 flag pattern), carried through the run save (saveRun/RunSave), so a resumed run that already learned never sees it again; a fresh run sees it at its first pay.
- **Where it lives:** the chip is a new file in the `systems/fx/` modeChip pattern, triggered from the interest's pay point (T0363's payout, both pay paths); it floats at the gold number and fades. The stats card's layout and the "bank +N" line (T0374) are untouched.
- **Why the screen has room:** a transient ~1.5 s chip in the game's own teach language (T0107, T0307, T0314, T0349, T0373), shown once per run; it says the rule, which nothing on screen says (the line shows only the current N), and it replaces nothing.

## Acceptance criteria
- [ ] The run's first interest pay of at least 1 gold pops the two-line chip at the stats card's gold number with the exact text, for ~1.5 s, fading with no mark left; a pay of 0 shows nothing.
- [ ] The chip shows exactly once per run: later pays show nothing, a resumed run that already saw it never shows it again (the flag survives the save), and a fresh run sees it at its first pay.
- [ ] Both pay paths trigger it — the countdown ending and the early send — whichever pays first.
- [ ] No change to the stats card's size or layout, no sound, no new input; the "bank +N" line is untouched; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
