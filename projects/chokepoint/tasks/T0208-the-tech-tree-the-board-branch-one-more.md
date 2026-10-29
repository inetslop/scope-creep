---
id: T0208
title: "The tech tree: the board branch — One more bend"
size: L
priority: 2
status: design
depends_on: [T0103]
attempts: 0
created: 2026-10-29T13:49:24Z
epic: E2
---

## Goal
E2's fourth branch on the tech screen: a node that changes the board of every new run — the tree stops buying numbers and starts shaping the world the run happens in. The first node makes the road wind further.

## Details
- A new row on the tech screen under “The pool” (T0153): the muted small label “The board” (T0103's row-label style) with one node card, registered the same way T0103/T0110/T0153 register their rows (one more `rows` entry; T0153's vertical drag-scroll and down-arrow cue already cover the overflow).
- The node: “One more bend” — 30 coins — card text: “new runs' roads wind one turn further.”
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border). No gate state: the effect is in the game the moment it is bought.
- Buying: 30 coins, T0103's balance pop and two-note chime, the owned state, saved to the profile's purchased list (T0103's persistence, parsed defensively; a buy is permanent and survives a reload). The node id is a plain board effect — it unlocks no augment, so T0153's `unlocks` stays `null` for it and `buyNode`-style storage is used (the architect keeps it consistent with the other branches' pure buy functions in `core/tech.ts`).
- The effect (new runs only): a new run generates its road with **one more bend than today** — the path's bend count (a bend = three consecutive path cells whose direction changes, T0140's definition) is the generator's usual count for that seed, plus one. Everything else — board size, rocks, entrance, exit — generates as today. The bend-adjacent cells (the worth-more cells, pillar 1) come with it: a windier road means more corners to build on, and the T0140 notches show where. Ghost runs (T0078) and resumed runs keep their exact board — the node shapes new runs, not saved ones.
- The effect is read where a new run already reads the profile's purchased list (T0103's start-bonuses wiring — the same place that loads `purchased` for `startBonuses`, see T0152's design step 10): a board-growth parameter flows from the purchased list to the path generator (the bend count is the generator's knob; the architect names the exact parameter in the design). With the node not owned the parameter's default keeps every generated board byte-identical to today.
- Layout: the four rows stack (Run start, The draft, The pool, The board) with T0103's row spacing; at 412×915 and 1280×720 every node on every row is visible and buyable — the existing scroll (T0153) covers the overflow. The menu layout (Play/Tech/Ghost/Resume) is untouched.

## Acceptance criteria
- [ ] The tech screen shows a fourth row, “The board” (T0103's label style), with one node card: “One more bend,” 30 coins.
- [ ] Buying it pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload; with fewer than 30 coins it dims with a red price and a tap does nothing.
- [ ] A unit test (at least 5 seeds, same seed bought vs. not bought): the owned run's path has exactly one more bend than the unowned one, and both are valid boards (size, entrance, exit, walkable path).
- [ ] In play, a new run with the node owned has a windier road (one more turn; the T0140 bend notches mark it); a ghost run of a saved board and a resumed run are byte-identical to before.
- [ ] With the node not owned, every generated board is byte-identical to today on every seed.
- [ ] At 412×915 and 1280×720 every node on all four rows is visible and buyable; the scroll cue behaves as today.
