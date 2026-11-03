---
id: T0471
title: "The wall: the reserve's second card — the next wave's walkers walk 0.7×"
size: M
priority: 2
status: design
depends_on: [T0463]
attempts: 0
created: 2026-11-03T04:35:57Z
epic: E24
---

## Goal
The reserve grows its second heavy card: for 80 gold, once per run, the next wave's walkers walk 0.7× — a whole-wave slow the player times against the wave they can see coming in the preview.

## Details
- The reserve card (T0463) gains a second entry under the surge: "Wall · 80" with the coin glyph while unbought (the surge line's own look, including its quiet state when the gold is short), its muted one-liner "next wave's walkers 0.7×", and "Wall · used" after the buy.
- The buy pays 80 gold, once per run, and the run save carries it (T0463's pattern). It applies to the wave that starts next — the one after the buy's build phase, whether it starts on the countdown or by early send.
- The effect: every walker in that wave moves at 0.7× its speed, for that wave only:
  - the crawl: every walker's base speed — Dot, Block, Hauler, Bulwark, Mute, the Ward's would-be speed (it ignores the wall, below), and the walkers a walled wave spawns mid-wave (the Shard, the Splinter, the Hive's popped Dots).
  - the dash: the Dasher's dash covers the same 3 cells in 0.3 s / 0.7 (≈ 0.43 s); its crawl and its pause are otherwise untouched.
  - the ramp: the Sprinter's current speed — base plus its ramp; the ramp keeps growing on top of the walled speed.
  - the boss: every walking boss (the Colossus, the Titan, the Orb, the Hive, the Mender, the Leech, the Gorge, and the Blinker's walk phase) at 0.7×.
  - untouched: the Ward (like its control immunity, T0111), the crossers (the Flyer boss and the regular Flyer keep their pace), the Blinker's blink jump itself (its distance and its cycle), a Push gust's distance, and the 2x fast-forward.
  - stacking: the 0.7× is one multiplicative factor on the walker's speed — applied with the wave's own speed rules (the thin road's 0.9, the rush tag's 1.5) and under the tower auras (the Haste's +30% to both applies to the walled speed, and any per-enemy slow applies as a percentage of it).
  - the wall is a wave rule, not a slow effect: no per-enemy mark, no slow chip (T0138), no Ward immunity ring (T0335) — the wave's own "walled" chip is its only display.
- The chip: the walled wave wears a muted "walled" chip where the "surged" chip sits (T0463) — on the preview's tag row (T0422) the moment the buy commits, and on the wave banner at the wave's start (T0080) — that wave only.
- Two cards bought in the same build phase both apply to the same next wave (their effects stack on it).
- The reserve card hides when every entry the card currently shows is spent (T0463's rule, counted over the entries that exist — not over the harvest, which is not built yet).
- A run that never buys the wall is byte-identical to today; the surge's entry and its behavior are untouched.

## Acceptance criteria
- [ ] In a build phase with 80+ gold the reserve card's second line reads "Wall · 80" with the coin glyph and the muted "next wave's walkers 0.7×" line; with 79 gold it wears the surge line's own quiet state and the tap does nothing.
- [ ] Buying pays 80 gold, the line reads "Wall · used", and in the next wave (countdown or early send) every walker moves at 0.7×: a Dot walks 1.12 cells/s, a max-ramp Sprinter walks 3.72 cells/s, the Dasher's dash takes ≈ 0.43 s for its 3 cells.
- [ ] In a walled wave the Ward and the crossers (the Flyer, the Flyer boss) keep their pace, the Blinker's blink jump is unchanged, and on a rush-tagged wave the walkers move 1.5 × 0.7 = 1.05× of base.
- [ ] The walled wave's preview tag row and its banner wear the muted "walled" chip; the following wave wears no chip; no per-enemy mark or chip appears on the slowed walkers.
- [ ] With the surge and the wall both bought the card hides (until the harvest exists, "every entry shown" means both); after closing the tab and resuming, the bought Wall still reads "Wall · used".
