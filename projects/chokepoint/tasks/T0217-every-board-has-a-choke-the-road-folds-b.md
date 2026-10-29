---
id: T0217
title: "Every board has a choke: the road folds back on itself"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T16:16:13Z
---

## Goal
The game is named for a tower watching two stretches of road at once — today that spot is luck of the seed, and some boards never come close to themselves, so their worth-more bend cells (pillar 1, the T0140 notches) are worth less than the rest. Every new board gets a guaranteed choke.

## Details
- What exists: the generator grows a winding path from entrance to exit (14x8 landscape, 8x14 portrait) with rocks and a bend target (T0208's territory). A cell beside a bend is "worth more" — it covers more road — only when the road passes nearby again, and nothing guarantees it does.
- A **choke cell** is a buildable cell within 1.7 cells (the game's shortest range, Splash's) of the centers of two road cells that are at least 3 path steps apart: from that cell every tower in the game reaches both stretches of road. Every new board has at least one.
- The change: a deterministic geometry pass after the usual generation (no rng draws, so the same seed still gives the same board). If the board already has a choke cell it is untouched — byte-identical to today for that seed. If not, the generator adds a turn or reroutes one stretch of the path until a choke cell exists, keeping the cells between the two stretches buildable (not road, not rock) and the path continuous, non-self-overlapping and inside the board.
- The seed decides where the choke sits, so every run's choke is somewhere else (pillar 2). The T0140 bend notches already mark the choke's cells — no new board art. The pass runs after the usual growth, so it composes with T0208's "One more bend" when both apply.
- Saved boards keep their exact shape: the pass is a change a bare seed cannot encode for old boards, so the run save and the profile's best-seed record carry a small board-generation version — T0208's saved-parameter pattern (its `bends` field does the same job for the extra bend): a board made before this change regenerates without the pass, a board made after it regenerates with its choke, and towers never land on path or rock after a resume or a ghost replay (T0078).
- Balance: every board is at least as strong as today (one guaranteed double-cover cell); the waves, which scale by wave number, are unchanged.

## Acceptance criteria
- [ ] A unit test over at least 50 fresh seeds per orientation (14x8 and 8x14): every generated board has at least one choke cell (a buildable cell within 1.7 of two road cells 3+ path steps apart); every path is still continuous from entrance to exit, uses no cell twice and stays in bounds; the same seed gives the same board.
- [ ] A board whose path already has a choke cell regenerates byte-identical with the new generator (the pass is a no-op), so its old saves and ghost replays are untouched.
- [ ] In play, a tower placed at a choke cell reaches both stretches — its range ring crosses the road twice, even at the shortest range (Splash); the T0140 notches mark the choke's bend cells; the board's look is otherwise unchanged (light island, white road, no new art).
- [ ] A resumed run shows the exact board it had (every tower on a buildable cell); a ghost run of a saved board shows that board's exact shape, with or without a choke.
