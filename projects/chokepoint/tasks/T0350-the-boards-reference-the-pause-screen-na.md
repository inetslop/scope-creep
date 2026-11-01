---
id: T0350
title: "The boards reference: the pause screen names the board's modifiers"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T09:12:53Z
claimed_at: 2026-11-01T09:12:57Z
epic: E13
designer: desktop
---

## Goal
E13 makes the road itself vary — a second gate, a marked cell, a fork to come. A player needs the vocabulary for what a board can be and where each thing comes from, on the pause screen, in the family of the waves, enemies and coins references (T0264, T0252, T0329).

## Details
- A new pause-off reference scene — a sibling of the Coins reference's scene, not the pick screen's Boards scene: a white rounded card titled "Boards," opened from the pause card the way the other references open, and listed where they are listed. Laid out for 412x915 and 1280x720 like its siblings.
- One row per board modifier, left to right: a small muted-ink mark (~24 px), the modifier's name in bold 14 px ink, and one muted 12 px dry line under it. The rows, exactly:
  - **The choke** — "one build cell that reaches the road twice" — tag: always
  - **One more bend** — "the road winds one bend more" — tag: tech · One more bend
  - **The long way** — "the road is longer" — tag: tech · The long way
  - **Two chokes** — "two cells that reach the road twice" — tag: tech · Two chokes
  - **The switchback** — "the road folds back into double cover" — tag: tech · The switchback
  - **The far gate** — "a second gate; a third of each non-boss wave comes through it" — tag: some boards
  - **The marked cell** — "one build cell that makes its tower stronger" — tag: some boards
- The tag is one muted 11 px line (or inline, the references' own tag style) at the row's end. The tech rows read the node's name from the tech's own data (the names are always the tree's, never retyped here) and show "owned" while the profile owns the node; the other rows show their tag as written.
- The marks are short flat fragments of the board's own language (muted ink on the white card; no outline, no glow, no theme): the choke — two road strokes that come within one cell of each other; One more bend — a road with one extra bend; The long way — the same bends, a longer road; Two chokes — two close pairs of strokes; The switchback — two parallel road strokes with build cells between; The far gate — a road with a second gate arrow partway along; The marked cell — a build cell with a small dot on it.
- The rows (mark key, name, meaning, tag kind) live in one small new pure module the scene reads, so a later modifier (the fork) lands by adding one entry there and one mark — no change to the pause card or the sibling references. The tech-tag read (node name, owned state from the tech's own data) is pure and unit-tested.
- Nothing shown twice: the tags point (a node's name, a kind); they never re-state a tech card's price or a pick card's per-board line, and the board itself stays unmarked.

## Acceptance criteria
- [ ] The pause screen offers "Boards" beside the other references; the card opens with the seven rows above, each with mark, name, meaning and tag, and fits its text at 412x915 and 1280x720.
- [ ] Each tech row's tag names the tech tree's own node (read from its data); while the profile owns that node the tag reads "owned".
- [ ] The choke row's tag reads "always"; the far gate and marked cell rows' tags read "some boards".
- [ ] The other pause screens (Summary, waves, enemies, coins references) and the tech tree are unchanged; adding a modifier means one entry in the module plus one mark.
