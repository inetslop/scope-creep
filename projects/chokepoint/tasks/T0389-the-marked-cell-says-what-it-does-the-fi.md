---
id: T0389
title: "The marked cell says what it does: the first build's one-time chip"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T23:40:10Z
---

## Goal
The moment a tower is first built on the marked cell, the cell says what it does: a first-time player learns the buff where the gold is spent, not on a second glance at the panel.

## Details
- The chip pops just above the marked cell the moment the run's first tower is built on it, and fades after ~1.5 s — the first-leak chip's own look (T0107: a small white rounded chip, bold muted-ink text), like the far gate's (T0384).
- The text names the cell's live buff: "marked · +25% damage" — the same value the panel line (T0387) reads, 25 plain and 50 while The rich cell is owned, so the chip is right before and after T0386 lands.
- The trigger is the marked cell receiving a tower for the first time in the run (a build today; E15's move, once it lands, inherits the same once-per-run check, so a move onto the cell tells it there too).
- Once per run: the flag is set before the effect and rides the run save like the other *Told fields (T0384), so a resumed run past the moment never replays it.
- No new sound, button, card line or permanent board mark: the cell's own mark, the board facts, the panel line and the wave preview are untouched.

## Acceptance criteria
- [ ] The first build on the marked cell pops a small white chip above the cell reading "marked · +25% damage" ("+50%" while The rich cell is owned), fading after ~1.5 s.
- [ ] A second build on the marked cell, and every build after, shows no chip.
- [ ] A resumed run past the moment never replays the chip.
- [ ] Everything else is byte-identical: no new sound, no new HUD element, no permanent mark on the board.
