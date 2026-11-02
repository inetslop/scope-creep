---
id: T0443
title: "The move's limit: one move per tower per build phase, and its teach"
size: M
priority: 2
status: design
depends_on: [T0389]
attempts: 0
created: 2026-11-02T20:29:42Z
epic: E15
---

## Goal
A moved tower does not move again in the same build phase — repositioning stays a one-shot decision with a price, not a free undo — and the player learns the limit once, at the moment they first open the move state (E15's last slice).

## Details
- **The limit:** after a tower's move is committed (✓, the T0394 core), that tower's panel line reads "moved" instead of "Move · −N" for the rest of that build phase: the line is dimmed in its own short-gold muted ink with no price, and tapping it does nothing — no move state, no outlines, no ✓/✗, no gold moves. Every other tower can still move once; the limit is per tower, per build phase — not per run, not shared between towers.
- **The reset:** at the start of the next build phase every tower's line reads "Move · −N" again, priced from its current slots (the T0394 rule); a tower that moved, then gained or lost a slot, re-prices normally.
- **The teach:** the first time in a run the player opens the move state (the first tap on any "Move · −N" line), one muted line "one move per build phase" appears under the move line in the one-time teach line's own look (T0314's shape: a muted line that fades after ~2 s), visible while the move state is open; it never shows again in that run — not for another tower, not in a later phase. The run remembers the moment it has shown, the way the other once-moments do (the marked-cell chip's field, T0389): a run resumed after the moment does not replay it; a resume before the moment still shows it when it comes.
- **Nothing else:** the commit itself (the fee, the "−N" chip at the old cell, the ~300 ms slide, the drop-in bounce, the place haptic, the T0392 note), the cancel, the marked-cell buff's follow and the sell line are all byte-identical to T0394. No new key, no new button, no new line on any card; the pause screen's controls list is unchanged.
- **The save:** the teach moment rides the run save like the other once flags (T0389's field pattern, including the save's validation and round-trip test). The moved state itself needs no save: a mid-build resume restores the pre-move snapshot (the T0394 rule) and the state clears at the build phase's start regardless.

## Acceptance criteria
- [ ] In a build phase, after committing a tower's move, its panel shows the dimmed "moved" line where "Move · −N" was; tapping it does nothing (no dim, no outlines, no ✓/✗, no gold moves); its sell line and the rest of the panel are unchanged.
- [ ] Every other tower in the same build phase can still move exactly once; after two towers have each moved, both read "moved".
- [ ] At the start of the next build phase every tower's line reads "Move · −N" again, priced from its current slots.
- [ ] In a fresh run, the first time the player opens the move state, the muted "one move per build phase" line fades under the move line while the state is open; it never shows again in that run, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] The commit, cancel, fee, slide, chip, bounce, haptic, the T0392 note, the marked-cell buff's follow and the sell line are byte-identical to T0394; the panel fits at 412x915 and 1280x720.
- [ ] `npm run check` and the desktop + mobile smoke pass.
