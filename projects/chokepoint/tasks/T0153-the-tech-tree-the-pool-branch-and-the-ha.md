---
id: T0153
title: "The tech tree: the pool branch and the Haste node"
size: M
priority: 2
status: designing
depends_on: [T0103]
attempts: 0
created: 2026-10-29T12:14:31Z
claimed_at: 2026-10-29T12:28:09Z
epic: E2
designer: desktop
---

## Goal
E2's third branch on the tech screen: a node that unlocks a new augment into the game's content — the tree stops changing numbers and starts growing the draft pool. The first node is Haste (T0152's gated Epic).

## Details
- A new row on the tech screen under “The draft” (T0110): the muted small label “The pool” (T0103's row-label style) with a single node card, registered the same way T0103/T0110 register their rows.
- The node: “Haste” — 25 coins — card text: “unlocks the Haste augment in the draft.”
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border) plus one new state: while the game has no Haste augment in its content (T0152 not landed), the node shows the locked/dim look with the muted line “not in the game yet” in place of the price, and a tap does nothing (no chime, no balance change). Once Haste is in the content, the node becomes buyable (affordable/unaffordable by the coin balance).
- Buying: 25 coins, T0103's balance pop and two-note chime at 0.1, the owned state (yellow border), saved to the profile's purchased list (T0103's persistence, parsed defensively; a buy is permanent and survives a reload).
- Effect: buying it adds Haste to the draft pool permanently — realized by Haste's own gate (T0152) reading the purchased list, so this task owns only the node, its states and its purchase; the pool flip is T0152's. Either task can land first: the node first, it sits “not in the game yet”; Haste first, it never rolls until the node is bought.
- Layout: the three rows stack (Run start, The draft, The pool) with T0103's row spacing; at 412×915 and 1280×720 every node on every row is visible and buyable — if the stacked rows overflow a screen, the card scrolls vertically (a simple drag) with a small muted down-arrow at the card's bottom edge as the cue. The menu layout (Play/Tech/Ghost/Resume) is untouched.

## Acceptance criteria
- [ ] The tech screen shows a third row, “The pool” (T0103's label style), with one node card: “Haste,” 25 coins.
- [ ] While the game has no Haste augment: the node shows the locked/dim look with the muted line “not in the game yet” (no price) and is unbuyable — a tap does nothing, no chime, no balance change.
- [ ] Once Haste is in the content: the node shows the normal affordable/unaffordable states; buying it pays 25 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload.
- [ ] After buying (with Haste in), the next draft roll can offer Haste (the Epic card); with the node not owned, no draft offers it — node owned iff Haste is rollable.
- [ ] At 412×915 and 1280×720 every node on all three rows is visible and buyable; if a screen's rows overflow, the card scrolls vertically with the muted down-arrow cue.
