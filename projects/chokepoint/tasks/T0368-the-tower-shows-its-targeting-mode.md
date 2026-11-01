---
id: T0368
title: The tower shows its targeting mode
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T17:18:47Z
---

## Goal
T0114's per-tower targeting mode (First / Strongest / Closest) is only visible in the selected tower's panel and on the pause screen. Make it readable across the whole board: a tower that is not on First wears one small notch on its plinth, and the first time a mode is chosen this run, a chip over the tower says what it means.

## Details
- **The plinth notch.** Every tower whose mode is Strongest or Closest wears one short muted-ink tick on its plinth, ~2 px, clear of the tier pip row (the face's free corner or the plinth's top edge — the plinth's look owns the exact spot). Muted ink, like the pips; no color and no per-mode shape: one mark, one meaning — "this tower is off First" — while the mode's own words stay where they are (the panel, the chip, T0114's pause line). It appears and clears the moment the mode changes, and it clears with the tower when it sells (the mode rides T0114's `targetMode`, so the notch is drawn from it every frame). A run in which no tower ever leaves First is byte-identical to today. It is a state read on the tower, in the family of the quiet idle dot (towerIdle) and the milestone ring (T0270) — not a cell hint: the removed T0140 notch painted the cells, this marks nothing about the board.
- **The one-time chip.** The first time this run a tower is switched to Strongest, a small white chip pops over that tower for ~1.5 s: "strongest · most hp". The first switch to Closest: "closest · nearest the tower". One chip per mode per run (at most two), the same small white chip as the new-enemy name chip (T0085) and the wave-tag chip (T0092). Switching back to First never chips — the notch simply clears. The run remembers what it has taught, through resume (T0085's once-per-type-per-run pattern): a resumed run never re-fires a chip that has already shown.
- **Display only.** No change to targeting behavior, no sound, no HUD card, no pause-screen change. The plinth face already wears the tier pip row, and the tower already wears its augment marks and its working ring: one ~2 px tick in the free corner says across the board what the panel says one tower at a time. Nothing is replaced.

## Acceptance criteria
- [ ] Set a tower to Strongest or Closest in its panel: the muted tick appears on its plinth, clear of the pip row; switch it back to First and it clears; a tower on First is byte-identical to today.
- [ ] The first switch this run to Strongest pops a small white chip over that tower for ~1.5 s reading "strongest · most hp" (Closest: "closest · nearest the tower"); a later switch to the same mode chips nothing; a resumed run never re-fires a chip that has already shown.
- [ ] Targeting, sound, the HUD and the pause screen are all unchanged; a run that never changes a mode is byte-identical to today.
