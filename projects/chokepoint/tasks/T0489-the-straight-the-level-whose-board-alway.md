---
id: T0489
title: "The straight: the level whose board always carries the sniper's straight"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T10:58:13Z
epic: E21
---

## Goal
The ninth level on the run-setup step: The straight. A run whose board always carries the sniper's board — the road's longest straight run is 7+ cells, so a build around the Reach (long range, slow, heavy shots) is the answer — and the ×1.40 coin multiplier pays for giving up the board's variety.

## Details
- The pick (the level pattern, T0446/T0452): the level joins the run-setup step's level set — the name "The straight", the dry one-liner "the straight is 7+ cells", the set's current multiplier notch (bonus 0.40, ×1.40 — Plain's own), and the level chip (the level chips' own look, name only) under the stats card for the whole run. The levels reference (T0467) names it from the set, and the daily board pick's level order takes it in (T0452's insert).
- The rule (The-straight runs only): the run's board always carries the long straight — the road's longest straight run of cells is 7+ (T0453's own rule, guaranteed instead of ~1-in-5). The long straight's exclusions hold: the board never carries the fork or the loop. Every other board feature follows its own seed-driven rules (rocks, the marked cell, the guaranteed choke, the cove, the twin, the double mark, the slow stretch, the switchback), so two different seeds give two different straight boards.
- What the player sees: every run, a board with a long straight road — the sniper's board: a Reach at the straight's edge covers most of it. Nothing is painted or marked on the board itself; the board facts (the pause's boards reference) name the long straight with their own line, and the level chip says the level is on.
- The ghost: a ghost run of a The-straight run regrows the straight board — the level's board rule rides the ghost the way Plain's does (T0452's pattern), so the regrown board is the run's exact board.
- A run without the level is byte-identical: the long straight stays ~1-in-5, seed-driven, and nothing else about the board changes.

## Acceptance criteria
- [ ] The run-setup step offers "The straight" with the one-liner "the straight is 7+ cells" and the ×1.40 multiplier; picking it shows the level chip for the whole run, and the levels reference and the daily board pick's level order include it.
- [ ] In a The-straight run, every board's longest straight run of road cells is 7+, in landscape and portrait; the board never carries the fork or the loop.
- [ ] Every other board feature is seed-driven as before: a The-straight run's board still rolls rocks, the marked cell, the guaranteed choke and the other modifiers by their own rules; two different seeds give two different straight boards.
- [ ] The board facts name the long straight on a The-straight run's board with their own line; nothing is painted or marked on the board's cells themselves.
- [ ] A ghost run of a The-straight run regrows the straight board (the level's board rule rides the ghost, the Plain pattern, T0452).
- [ ] A run without the level is byte-identical before and after: same boards from the same seeds, the long straight at its own ~1-in-5 rate.
- [ ] Unit tests cover the forced straight (a sweep of seeds: every board 7+, none fork or loop), the other features' independence, and the plain run's byte-identity.
