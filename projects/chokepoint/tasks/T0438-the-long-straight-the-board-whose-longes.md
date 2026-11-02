---
id: T0438
title: "The long straight: the board whose longest straight is 7+ cells"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T18:33:27Z
---

## Goal
About one board in five grows one long straight — the road's longest straight run of cells is at least 7 — so the board has a stretch a single long-range tower can cover from one side: the player reads the straight against the choke, and the sniper's build gets a board of its own.

## Details
- **The shape.** On these boards the road's longest straight run of road cells is at least 7 cells — one module constant (7, or the next longer value that keeps the ~1-in-5 rate, if today's generator already runs that long); the rest of the road generates exactly as today. The straight is visible as a long unbroken run of white road; nothing is painted on it or beside it (the board's own bar: the player sees the straight from the road itself).
- **The frequency.** ~1-in-5 boards, decided by the seed hash the way the cove and the twin decide theirs — the decision and the shape derive from the board's own seed, stable across resumes and ghost replays (the board grows from the seed, so the run save is untouched).
- **The exclusivity.** Exclusive with the fork and the loop (both already reshape the whole road); it coexists with the cove, the twin, the marked cell, the double mark, the far gate, the slow stretch and the rocks exactly as those coexist with each other.
- **Why placing gets more interesting.** A straight has no bends of its own, so the board's guaranteed choke (T0217) sits off it: the board's question is cover the straight or hold the choke. A Reach (or Reach-heavy) tower at the straight's edge covers most of the straight from one cell, and enemies on it walk the open longest of any board — a different optimal build from the cove's pocket or the loop's long folds (the sniper's board, in the boards reference's own language).
- **The reads.** The boards reference gains its row: "The long straight — some boards", with its own committed seed and mini board (the twin row's pattern, the next free committed seed); the board facts name it like the other modifiers (the fact reads the constant: "the road's longest straight is N+ cells").
- **No new teach, mark, HUD element, key or sound** — the marked cell's and the cove's pattern: the shape is visible on the board, named in the reference.

## Acceptance criteria
- [ ] ~1-in-5 boards (a hash-rate test, the cove's and the twin's own test pattern) carry a road whose longest straight run is at least the module constant (7 or longer), deterministic per seed; no-hash boards keep today's roads byte-identically; fork and loop boards never carry it.
- [ ] The board facts name the modifier and the boards reference shows its row with a committed-seed mini board whose longest straight is visibly long; the cove, twin, marked cell and double-mark tests are untouched (no exclusivity with them).
- [ ] A run on a long-straight board plays and resumes identically to its seed (nothing in the run save); a runChecks invariant (hash ⇒ longest straight ≥ the constant) passes; `npm run check` and the desktop + mobile smoke pass.
